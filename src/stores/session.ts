import { defineStore } from "pinia"
import { computed, ref } from "vue"

import { projectCashFlow } from "@/cashflow/project"
import { addDays, compareIso, dayNumber, todayIso } from "@/domain/dates"
import {
  DEFAULT_FORECAST_DAYS,
  type OverduePayment,
  type Subscription,
} from "@/domain/types"

export const useSessionStore = defineStore("session", () => {
  const subscriptions = ref<Subscription[]>([])
  const sourceName = ref<string | null>(null)
  const forecastDayCount = ref(DEFAULT_FORECAST_DAYS)

  const hasData = computed(() => subscriptions.value.length > 0)
  const activeSubscriptions = computed(() =>
    subscriptions.value.filter((subscription) => subscription.isActive),
  )
  const excludedCount = computed(() =>
    subscriptions.value.filter((subscription) => !subscription.participatesInBudget).length,
  )

  const today = computed(() => todayIso())

  const overduePayments = computed<OverduePayment[]>(() => {
    const start = today.value
    return subscriptions.value
      .filter((subscription) => subscription.participatesInBudget)
      .map((subscription) => ({
        subscription,
        dueOn: subscription.nextBillingOn,
      }))
      .filter((item): item is { subscription: Subscription; dueOn: string } =>
        item.dueOn !== null && compareIso(item.dueOn, start) < 0,
      )
      .sort((left, right) => compareIso(left.dueOn, right.dueOn))
      .map((item) => ({
        subscription: item.subscription,
        dueOn: item.dueOn,
        daysOverdue: dayNumber(start) - dayNumber(item.dueOn),
      }))
  })

  const forecast = computed(() => {
    const startsOn = today.value
    const endsOn = addDays(startsOn, forecastDayCount.value - 1)
    return projectCashFlow(subscriptions.value, startsOn, endsOn)
  })

  function replaceSubscriptions(next: Subscription[], fileName: string): void {
    subscriptions.value = next
    sourceName.value = fileName
  }

  function clear(): void {
    subscriptions.value = []
    sourceName.value = null
  }

  function setForecastDayCount(dayCount: number): void {
    forecastDayCount.value = dayCount
  }

  return {
    subscriptions,
    sourceName,
    forecastDayCount,
    hasData,
    activeSubscriptions,
    excludedCount,
    overduePayments,
    forecast,
    replaceSubscriptions,
    clear,
    setForecastDayCount,
  }
})
