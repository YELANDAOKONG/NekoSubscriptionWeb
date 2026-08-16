<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue"
import { computed, ref, watch } from "vue"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
import EmptyState from "@/components/EmptyState.vue"
import { projectCashFlow } from "@/cashflow/project"
import {
  addDays,
  addMonths,
  startOfMonth,
  todayIso,
  weekdayMondayFirst,
} from "@/domain/dates"
import { CALENDAR_DAY_COUNT, type CashFlowItem } from "@/domain/types"
import { formatIsoDate, formatMoney, formatMonthTitle } from "@/i18n/format"
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
  isSelected: boolean
  payments: CashFlowItem[]
}

const preferences = usePreferencesStore()
const session = useSessionStore()
const today = todayIso()
const displayedMonth = ref(startOfMonth(today))
const selectedDate = ref(today)

watch(displayedMonth, (month) => {
  if (!selectedDate.value.startsWith(month.slice(0, 7))) {
    selectedDate.value = month
  }
})

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
      isToday: date === today,
      isSelected: date === selectedDate.value,
      payments: paymentsByDate.get(date) ?? [],
    }
  })
})

const selectedDay = computed(() =>
  days.value.find((day) => day.date === selectedDate.value) ?? null,
)

function goToPreviousMonth(): void {
  displayedMonth.value = addMonths(displayedMonth.value, -1)
}

function goToNextMonth(): void {
  displayedMonth.value = addMonths(displayedMonth.value, 1)
}

function goToToday(): void {
  displayedMonth.value = startOfMonth(today)
  selectedDate.value = today
}

function selectDate(date: string): void {
  selectedDate.value = date
  displayedMonth.value = startOfMonth(date)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_Calendar") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_CalendarSubtitle") }}
      </p>
    </div>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Subscriptions_NoDataTitle')"
      :description="preferences.t('Subscriptions_NoDataDescription')"
    />

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
          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium sm:text-sm">
            <div v-for="key in WEEKDAY_KEYS" :key="key" class="text-muted-foreground py-1">
              {{ preferences.t(key) }}
            </div>
          </div>
          <div class="mt-1 grid grid-cols-7 gap-1">
            <button
              v-for="day in days"
              :key="day.date"
              type="button"
              :class="cn(
                'hover:bg-accent flex min-h-14 flex-col items-start rounded-md border p-1 text-left sm:min-h-24 sm:p-2',
                day.inMonth ? 'bg-background' : 'bg-muted/40 text-muted-foreground',
                day.isSelected && 'border-primary ring-ring ring-1',
                day.isToday && !day.isSelected && 'border-primary/40',
              )"
              @click="selectDate(day.date)"
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
        </CardContent>
      </Card>

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
        <CardContent class="flex flex-col gap-2">
          <p v-if="!selectedDay || selectedDay.payments.length === 0" class="text-muted-foreground text-sm">
            {{ preferences.t("Calendar_NoPayments") }}
          </p>
          <Item
            v-for="payment in selectedDay?.payments ?? []"
            :key="`${payment.subscriptionId}-${payment.scheduledOn}`"
            variant="outline"
            size="sm"
          >
            <ItemContent>
              <ItemTitle>{{ payment.serviceName }}</ItemTitle>
              <ItemDescription>{{ payment.providerName }}</ItemDescription>
            </ItemContent>
            <Badge variant="secondary">
              {{ formatMoney(payment.amount, preferences.resolvedLocale) }}
            </Badge>
          </Item>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
