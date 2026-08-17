<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core"
import { computed, ref } from "vue"
import { AlertTriangle, LayoutDashboard, Upload } from "@lucide/vue"

import EmptyState from "@/components/EmptyState.vue"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCsvImport } from "@/composables/useCsvImport"
import type { CurrencyAmountTotal } from "@/domain/types"
import { FORECAST_PERIODS } from "@/domain/types"
import { formatIsoDate, formatMoney } from "@/i18n/format"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const preferences = usePreferencesStore()
const session = useSessionStore()
const { openImport } = useCsvImport()

const upcoming = computed(() => session.forecast.items)
const nextPaymentLabel = computed(() => {
  const first = upcoming.value[0]
  if (!first) {
    return preferences.t("Common_NothingScheduled")
  }

  return formatIsoDate(first.scheduledOn, preferences.resolvedLocale)
})
const periodValue = computed({
  get: () => String(session.forecastDayCount),
  set: (value: string | number) => {
    session.setForecastDayCount(Number(value))
  },
})
const periodScroller = ref<HTMLElement | null>(null)
const canScrollPeriodLeft = ref(false)
const canScrollPeriodRight = ref(false)

function updatePeriodFade(): void {
  const scroller = periodScroller.value
  if (!scroller) {
    canScrollPeriodLeft.value = false
    canScrollPeriodRight.value = false
    return
  }

  canScrollPeriodLeft.value = scroller.scrollLeft > 1
  canScrollPeriodRight.value = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1
}

const periodMaskStyle = computed(() => {
  if (!canScrollPeriodLeft.value && !canScrollPeriodRight.value) {
    return undefined
  }

  const start = canScrollPeriodLeft.value ? "transparent 0, black 12px" : "black 0"
  const end = canScrollPeriodRight.value
    ? "black calc(100% - 12px), transparent 100%"
    : "black 100%"
  const image = `linear-gradient(to right, ${start}, ${end})`
  return {
    maskImage: image,
    WebkitMaskImage: image,
  }
})

useResizeObserver(periodScroller, updatePeriodFade)

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
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Forecast_Title") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_OverviewSubtitle") }}
      </p>
    </div>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Empty_ForecastTitle')"
      :description="preferences.t('Empty_ForecastDescription')"
    >
      <template #icon>
        <LayoutDashboard />
      </template>
      <Button @click="openImport()">
        <Upload />
        {{ preferences.t("Settings_ImportCsv") }}
      </Button>
    </EmptyState>

    <template v-else>
      <div class="flex flex-col gap-4">
        <Tabs v-model="periodValue">
          <div
            ref="periodScroller"
            class="-mx-1 overflow-x-auto px-1"
            :style="periodMaskStyle"
            @scroll="updatePeriodFade"
          >
            <TabsList>
              <TabsTrigger
                v-for="days in FORECAST_PERIODS"
                :key="days"
                :value="String(days)"
              >
                {{ preferences.t("Forecast_DayOption", days) }}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div>
          <p class="text-muted-foreground text-sm">
            {{ preferences.t("Forecast_PeriodLabel", session.forecastDayCount) }}
          </p>
          <div
            v-if="session.forecast.currencyTotals.length > 0"
            class="mt-2 flex flex-col gap-1"
          >
            <p
              v-for="total in session.forecast.currencyTotals"
              :key="`${total.currencyCode}-${total.currencyKind}`"
              class="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
            >
              {{ formatTotal(total) }}
            </p>
          </div>
          <p v-else class="text-muted-foreground mt-2 text-sm">
            {{ preferences.t("Dashboard_EmptyCashTitle") }}
          </p>
          <p v-if="session.excludedCount > 0" class="text-muted-foreground mt-2 text-sm">
            {{ preferences.t("Forecast_ExcludedSubscriptions", session.excludedCount) }}
          </p>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-x-6 gap-y-3 border-y py-4 sm:grid-cols-4">
        <div>
          <dt class="text-muted-foreground text-xs">{{ preferences.t("Dashboard_MetricActive") }}</dt>
          <dd class="mt-1 text-lg font-medium tabular-nums">{{ session.activeSubscriptions.length }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground text-xs">{{ preferences.t("Dashboard_MetricPayments") }}</dt>
          <dd class="mt-1 text-lg font-medium tabular-nums">{{ session.forecast.items.length }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground text-xs">{{ preferences.t("Dashboard_MetricInactive") }}</dt>
          <dd class="mt-1 text-lg font-medium tabular-nums">{{ session.excludedCount }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground text-xs">{{ preferences.t("Dashboard_NextPayment") }}</dt>
          <dd class="mt-1 text-lg font-medium">{{ nextPaymentLabel }}</dd>
        </div>
      </dl>

      <Alert v-if="session.overduePayments.length > 0">
        <AlertTriangle />
        <AlertTitle>{{ preferences.t("Forecast_OverdueTitle") }}</AlertTitle>
        <AlertDescription class="flex flex-col gap-2">
          <p>{{ preferences.t("Forecast_OverdueDescription") }}</p>
          <p
            v-if="session.overdueCurrencyTotals.length > 0"
            class="text-foreground flex flex-wrap gap-x-4 gap-y-1 font-medium tabular-nums"
          >
            <span
              v-for="total in session.overdueCurrencyTotals"
              :key="`${total.currencyCode}-${total.currencyKind}`"
            >
              {{ formatTotal(total) }}
            </span>
          </p>
        </AlertDescription>
      </Alert>

      <ul v-if="session.overduePayments.length > 0" class="divide-y rounded-lg border">
        <li
          v-for="item in session.overduePayments"
          :key="item.subscription.id"
          class="flex items-start justify-between gap-3 px-3 py-2.5"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">{{ item.subscription.serviceName }}</p>
            <p class="text-muted-foreground text-sm">
              {{ item.subscription.providerName }}
            </p>
            <p class="text-muted-foreground text-xs">
              {{ formatIsoDate(item.dueOn, preferences.resolvedLocale) }},
              {{ preferences.t("Forecast_DaysOverdue", item.daysOverdue) }}
            </p>
          </div>
          <p class="text-destructive shrink-0 font-medium tabular-nums">
            {{ formatMoney(item.subscription.billingAmount, preferences.resolvedLocale) }}
          </p>
        </li>
      </ul>

      <section class="flex flex-col gap-3">
        <div>
          <h2 class="text-lg font-semibold">{{ preferences.t("Dashboard_UpcomingTitle") }}</h2>
          <p class="text-muted-foreground text-sm">
            {{ preferences.t("Forecast_UpcomingDescription") }}
          </p>
        </div>
        <p v-if="upcoming.length === 0" class="text-muted-foreground text-sm">
          {{ preferences.t("Dashboard_EmptyUpcomingDescription") }}
        </p>
        <ul v-else class="max-h-[min(32rem,70vh)] divide-y overflow-y-auto rounded-lg border">
          <li
            v-for="item in upcoming"
            :key="`${item.subscriptionId}-${item.scheduledOn}`"
            class="flex items-start justify-between gap-3 px-3 py-2.5"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">{{ item.serviceName }}</p>
              <p class="text-muted-foreground text-sm">
                {{ item.providerName }}
              </p>
              <p class="text-muted-foreground text-xs">
                {{ formatIsoDate(item.scheduledOn, preferences.resolvedLocale) }}
              </p>
            </div>
            <p class="shrink-0 font-medium tabular-nums">
              {{ formatMoney(item.amount, preferences.resolvedLocale) }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
