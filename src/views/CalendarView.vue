<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, Upload } from "@lucide/vue"
import { useEventListener } from "@vueuse/core"
import { computed, nextTick, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EmptyState from "@/components/EmptyState.vue"
import SampleCsvButton from "@/components/SampleCsvButton.vue"
import { summarizeItemAmounts } from "@/cashflow/cost"
import { useCsvImport } from "@/composables/useCsvImport"
import { useToday } from "@/composables/useToday"
import { projectCashFlow } from "@/cashflow/project"
import {
  addDays,
  addMonths,
  daysPerWeek,
  parseSupportedDate,
  startOfMonth,
  weekdayMondayFirst,
} from "@/domain/dates"
import { CALENDAR_DAY_COUNT, type CashFlowItem, type CurrencyAmountTotal } from "@/domain/types"
import { formatIsoDate, formatMoney, formatMonthTitle } from "@/i18n/format"
import { compactQuery, queryParam } from "@/navigation"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"
import { cn } from "@/lib/utils"

const WEEKDAY_KEYS = [
  "Calendar_MondayShort",
  "Calendar_TuesdayShort",
  "Calendar_WednesdayShort",
  "Calendar_ThursdayShort",
  "Calendar_FridayShort",
  "Calendar_SaturdayShort",
  "Calendar_SundayShort",
] as const

type CalendarDay = {
  date: string
  inMonth: boolean
  isToday: boolean
  payments: CashFlowItem[]
}

const preferences = usePreferencesStore()
const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const { openImport } = useCsvImport()
const today = useToday()
const displayedMonth = ref(startOfMonth(today.value))
const selectedDate = ref(today.value)
const calendarGrid = ref<HTMLElement | null>(null)
const selectedDayDetail = ref<HTMLElement | null>(null)
const weekLength = daysPerWeek()

const days = computed<CalendarDay[]>(() => {
  const monthStart = displayedMonth.value
  const startOffset = weekdayMondayFirst(monthStart)
  const calendarStartsOn = addDays(monthStart, -startOffset)
  const calendarEndsOn = addDays(calendarStartsOn, CALENDAR_DAY_COUNT - 1)
  const projection = projectCashFlow(session.subscriptions, calendarStartsOn, calendarEndsOn)
  const paymentsByDate = new Map<string, CashFlowItem[]>()
  for (const item of projection.items) {
    const current = paymentsByDate.get(item.scheduledOn) ?? []
    current.push(item)
    paymentsByDate.set(item.scheduledOn, current)
  }

  return Array.from({ length: CALENDAR_DAY_COUNT }, (_, index) => {
    const date = addDays(calendarStartsOn, index)
    return {
      date,
      inMonth: date.startsWith(monthStart.slice(0, 7)),
      isToday: date === today.value,
      payments: paymentsByDate.get(date) ?? [],
    }
  })
})

const weeks = computed(() => {
  const result: CalendarDay[][] = []
  for (let index = 0; index < days.value.length; index += weekLength) {
    result.push(days.value.slice(index, index + weekLength))
  }
  return result
})

const selectedDay = computed(() =>
  days.value.find((day) => day.date === selectedDate.value) ?? null,
)

const selectedDayTotals = computed(() => summarizeItemAmounts(selectedDay.value?.payments ?? []))

function formatTotal(total: CurrencyAmountTotal): string {
  return formatMoney(
    {
      amount: total.totalAmount,
      currencyCode: total.currencyCode,
      currencyKind: total.currencyKind,
    },
    preferences.resolvedLocale,
  )
}

function dayAriaLabel(day: CalendarDay): string {
  const dateLabel = formatIsoDate(day.date, preferences.resolvedLocale)
  if (day.payments.length === 0) {
    return dateLabel
  }

  return preferences.t("Calendar_DayWithPayments", dateLabel, day.payments.length)
}

function goToPreviousMonth(): void {
  selectDate(addMonths(selectedDate.value, -1))
}

function goToNextMonth(): void {
  selectDate(addMonths(selectedDate.value, 1))
}

function goToToday(): void {
  selectDate(today.value)
}

function selectDate(date: string, options?: { scrollToDetail?: boolean }): void {
  selectedDate.value = date
  displayedMonth.value = startOfMonth(date)
  if (queryParam(route.query.date) !== date) {
    void router.replace({ query: compactQuery(route.query, { date }) })
  }
  if (options?.scrollToDetail) {
    void nextTick(scrollSelectedDayDetailIntoView)
  }
}

function scrollSelectedDayDetailIntoView(): void {
  if (window.matchMedia("(min-width: 1280px)").matches) {
    return
  }

  selectedDayDetail.value?.scrollIntoView({
    block: "nearest",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  })
}

function focusSelectedDay(): void {
  calendarGrid.value
    ?.querySelector<HTMLButtonElement>(`[data-calendar-day="${selectedDate.value}"]`)
    ?.focus()
}

function moveSelectedDay(dayOffset: number): void {
  selectDate(addDays(selectedDate.value, dayOffset))
  void nextTick(focusSelectedDay)
}

function onCalendarKeydown(event: KeyboardEvent): void {
  if (!session.hasData || event.defaultPrevented) {
    return
  }

  if (event.altKey || event.ctrlKey || event.metaKey) {
    return
  }

  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault()
      moveSelectedDay(-1)
      break
    case "ArrowRight":
      event.preventDefault()
      moveSelectedDay(1)
      break
    case "ArrowUp":
      event.preventDefault()
      moveSelectedDay(-weekLength)
      break
    case "ArrowDown":
      event.preventDefault()
      moveSelectedDay(weekLength)
      break
    case "Home":
      event.preventDefault()
      moveSelectedDay(-weekdayMondayFirst(selectedDate.value))
      break
    case "End":
      event.preventDefault()
      moveSelectedDay(weekLength - 1 - weekdayMondayFirst(selectedDate.value))
      break
    case "PageUp":
      event.preventDefault()
      selectDate(addMonths(selectedDate.value, -1))
      void nextTick(focusSelectedDay)
      break
    case "PageDown":
      event.preventDefault()
      selectDate(addMonths(selectedDate.value, 1))
      void nextTick(focusSelectedDay)
      break
    default:
      break
  }
}

useEventListener(calendarGrid, "keydown", onCalendarKeydown)

watch(
  () => queryParam(route.query.date),
  (value) => {
    if (value === undefined) {
      return
    }

    const date = parseSupportedDate(value)
    if (date === null || date === selectedDate.value) {
      return
    }

    selectedDate.value = date
    displayedMonth.value = startOfMonth(date)
    void nextTick(scrollSelectedDayDetailIntoView)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-muted-foreground text-sm md:text-base">
      {{ preferences.t("Page_CalendarSubtitle") }}
    </p>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Empty_CalendarTitle')"
      :description="preferences.t('Empty_CalendarDescription')"
    >
      <template #icon>
        <CalendarDays />
      </template>
      <div class="flex flex-wrap justify-center gap-2">
        <Button @click="openImport()">
          <Upload />
          {{ preferences.t("Settings_ImportCsv") }}
        </Button>
        <SampleCsvButton />
      </div>
    </EmptyState>

    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
      <Card>
        <CardHeader class="gap-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{{ formatMonthTitle(displayedMonth, preferences.resolvedLocale) }}</CardTitle>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" :aria-label="preferences.t('Calendar_PreviousMonth')" @click="goToPreviousMonth">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="sm" @click="goToToday">
                {{ preferences.t("Calendar_Today") }}
              </Button>
              <Button variant="outline" size="icon-sm" :aria-label="preferences.t('Calendar_NextMonth')" @click="goToNextMonth">
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref="calendarGrid"
            role="grid"
            :aria-label="preferences.t('Calendar_GridLabel')"
          >
            <div role="row" class="grid grid-cols-7 gap-1 text-center text-xs font-medium sm:text-sm">
              <div
                v-for="key in WEEKDAY_KEYS"
                :key="key"
                role="columnheader"
                class="text-muted-foreground py-1"
              >
                {{ preferences.t(key) }}
              </div>
            </div>
            <div class="mt-1 grid gap-1">
              <div
                v-for="(week, weekIndex) in weeks"
                :key="weekIndex"
                role="row"
                class="grid grid-cols-7 gap-1"
              >
                <button
                  v-for="day in week"
                  :key="day.date"
                  type="button"
                  role="gridcell"
                  :data-calendar-day="day.date"
                  :tabindex="day.date === selectedDate ? 0 : -1"
                  :aria-pressed="day.date === selectedDate"
                  :aria-selected="day.date === selectedDate"
                  :aria-current="day.isToday ? 'date' : undefined"
                  :aria-label="dayAriaLabel(day)"
                  :class="cn(
                    'hover:bg-accent focus-visible:ring-ring flex min-h-14 flex-col items-start rounded-md border p-1 text-left outline-none focus-visible:ring-2 sm:min-h-24 sm:p-2',
                    day.inMonth ? 'bg-background' : 'bg-muted/40 text-muted-foreground',
                    day.date === selectedDate && 'border-primary ring-ring ring-1',
                    day.isToday && day.date !== selectedDate && 'border-primary/40',
                  )"
                  @click="selectDate(day.date, { scrollToDetail: true })"
                >
                  <span class="flex w-full items-center justify-between text-xs sm:text-sm">
                    <span :class="cn('font-medium', day.isToday && 'text-primary')">
                      {{ Number(day.date.slice(8)) }}
                    </span>
                    <Badge v-if="day.payments.length > 0" variant="secondary" class="h-5 px-1 text-[10px] sm:hidden">
                      {{ day.payments.length }}
                    </Badge>
                  </span>
                  <div class="mt-1 hidden w-full flex-col gap-1 sm:flex">
                    <span
                      v-for="payment in day.payments.slice(0, 2)"
                      :key="`${payment.subscriptionId}-${payment.scheduledOn}`"
                      class="truncate text-[11px]"
                    >
                      {{ payment.serviceName }}
                    </span>
                    <span v-if="day.payments.length > 2" class="text-muted-foreground text-[11px]">
                      {{ preferences.t("Calendar_AdditionalPayments", day.payments.length - 2) }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref="selectedDayDetail">
        <Card>
          <CardHeader>
            <CardTitle>
              {{
                selectedDay
                  ? formatIsoDate(selectedDay.date, preferences.resolvedLocale, "PPP")
                  : preferences.t("Calendar_Today")
              }}
            </CardTitle>
            <CardDescription>
              {{ preferences.t("Calendar_SelectedDaySummary", selectedDay?.payments.length ?? 0) }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              v-if="selectedDayTotals.length > 0"
              class="text-foreground mb-3 flex flex-wrap gap-x-4 gap-y-1 font-medium tabular-nums"
            >
              <span
                v-for="total in selectedDayTotals"
                :key="`${total.currencyCode}-${total.currencyKind}`"
              >
                {{ formatTotal(total) }}
              </span>
            </p>
            <p v-if="!selectedDay || selectedDay.payments.length === 0" class="text-muted-foreground text-sm">
              {{ preferences.t("Calendar_NoPayments") }}
            </p>
            <ul v-else class="divide-y rounded-lg border">
              <li
                v-for="payment in selectedDay.payments"
                :key="`${payment.subscriptionId}-${payment.scheduledOn}`"
                class="flex items-start justify-between gap-3 px-3 py-2.5"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ payment.serviceName }}</p>
                  <p class="text-muted-foreground text-sm">{{ payment.providerName }}</p>
                </div>
                <p class="shrink-0 font-medium tabular-nums">
                  {{ formatMoney(payment.amount, preferences.resolvedLocale) }}
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
