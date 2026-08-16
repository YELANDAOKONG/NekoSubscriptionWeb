<script setup lang="ts">
import { computed } from "vue"
import { AlertTriangle } from "@lucide/vue"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmptyState from "@/components/EmptyState.vue"
import { FORECAST_PERIODS, MAXIMUM_UPCOMING_PAYMENT_COUNT } from "@/domain/types"
import { formatIsoDate, formatMoney } from "@/i18n/format"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const preferences = usePreferencesStore()
const session = useSessionStore()

const upcoming = computed(() =>
  session.forecast.items.slice(0, MAXIMUM_UPCOMING_PAYMENT_COUNT),
)
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
      :title="preferences.t('Subscriptions_NoDataTitle')"
      :description="preferences.t('Subscriptions_NoDataDescription')"
    />

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card class="py-4">
          <CardHeader class="px-4">
            <CardDescription>{{ preferences.t("Dashboard_MetricActive") }}</CardDescription>
            <CardTitle class="text-2xl">{{ session.activeSubscriptions.length }}</CardTitle>
            <CardDescription>{{ preferences.t("Dashboard_MetricActiveCaption") }}</CardDescription>
          </CardHeader>
        </Card>
        <Card class="py-4">
          <CardHeader class="px-4">
            <CardDescription>{{ preferences.t("Dashboard_MetricPayments") }}</CardDescription>
            <CardTitle class="text-2xl">{{ session.forecast.items.length }}</CardTitle>
            <CardDescription>{{ preferences.t("Dashboard_MetricPaymentsCaption") }}</CardDescription>
          </CardHeader>
        </Card>
        <Card class="py-4">
          <CardHeader class="px-4">
            <CardDescription>{{ preferences.t("Dashboard_MetricInactive") }}</CardDescription>
            <CardTitle class="text-2xl">{{ session.excludedCount }}</CardTitle>
            <CardDescription>{{ preferences.t("Dashboard_MetricInactiveCaption") }}</CardDescription>
          </CardHeader>
        </Card>
        <Card class="py-4">
          <CardHeader class="px-4">
            <CardDescription>{{ preferences.t("Dashboard_NextPayment") }}</CardDescription>
            <CardTitle class="text-lg md:text-xl">{{ nextPaymentLabel }}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div class="flex flex-col gap-3">
        <Tabs v-model="periodValue">
          <div class="-mx-1 overflow-x-auto px-1">
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
        <p class="text-muted-foreground text-sm">
          {{ preferences.t("Forecast_PeriodLabel", session.forecastDayCount) }}
        </p>
        <p v-if="session.excludedCount > 0" class="text-muted-foreground text-sm">
          {{ preferences.t("Forecast_ExcludedSubscriptions", session.excludedCount) }}
        </p>
      </div>

      <Alert v-if="session.overduePayments.length > 0">
        <AlertTriangle />
        <AlertTitle>{{ preferences.t("Forecast_OverdueTitle") }}</AlertTitle>
        <AlertDescription>
          {{ preferences.t("Forecast_OverdueDescription") }}
        </AlertDescription>
      </Alert>

      <div v-if="session.overduePayments.length > 0" class="grid gap-2">
        <Item
          v-for="item in session.overduePayments"
          :key="item.subscription.id"
          variant="outline"
          size="sm"
        >
          <ItemContent>
            <ItemTitle>{{ item.subscription.serviceName }}</ItemTitle>
            <ItemDescription>
              {{ item.subscription.providerName }}
              ·
              {{ formatIsoDate(item.dueOn, preferences.resolvedLocale) }}
              ·
              {{ preferences.t("Forecast_DaysOverdue", item.daysOverdue) }}
            </ItemDescription>
          </ItemContent>
          <Badge variant="destructive">
            {{ formatMoney(item.subscription.billingAmount, preferences.resolvedLocale) }}
          </Badge>
        </Item>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{{ preferences.t("Forecast_CashFlowTitle") }}</CardTitle>
            <CardDescription>{{ preferences.t("Dashboard_CashFlowDescription") }}</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <EmptyState
              v-if="session.forecast.currencyTotals.length === 0"
              :title="preferences.t('Dashboard_EmptyCashTitle')"
              :description="preferences.t('Dashboard_EmptyCashDescription')"
            />
            <div
              v-for="total in session.forecast.currencyTotals"
              :key="`${total.currencyCode}-${total.currencyKind}`"
              class="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p class="font-medium">{{ total.currencyCode }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ preferences.t("Column_Fixed") }}
                  {{ formatMoney({ amount: total.fixedAmount, currencyCode: total.currencyCode, currencyKind: total.currencyKind }, preferences.resolvedLocale) }}
                </p>
              </div>
              <p class="text-right font-semibold">
                {{ formatMoney({ amount: total.totalAmount, currencyCode: total.currencyCode, currencyKind: total.currencyKind }, preferences.resolvedLocale) }}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ preferences.t("Dashboard_UpcomingTitle") }}</CardTitle>
            <CardDescription>{{ preferences.t("Forecast_UpcomingDescription") }}</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <EmptyState
              v-if="upcoming.length === 0"
              :title="preferences.t('Dashboard_EmptyUpcomingTitle')"
              :description="preferences.t('Dashboard_EmptyUpcomingDescription')"
            />
            <Item v-for="item in upcoming" :key="`${item.subscriptionId}-${item.scheduledOn}`" variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{{ item.serviceName }}</ItemTitle>
                <ItemDescription>
                  {{ item.providerName }}
                  ·
                  {{ formatIsoDate(item.scheduledOn, preferences.resolvedLocale) }}
                </ItemDescription>
              </ItemContent>
              <Badge variant="secondary">
                {{ formatMoney(item.amount, preferences.resolvedLocale) }}
              </Badge>
            </Item>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
