<script setup lang="ts">
import { computed } from "vue"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import EmptyState from "@/components/EmptyState.vue"
import { monthlyEquivalentAmount } from "@/cashflow/cost"
import type { CurrencyAmountTotal, Subscription } from "@/domain/types"
import { cycleLabel, formatMoney } from "@/i18n/format"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

type CostRow = {
  subscription: Subscription
  monthlyAmount: number
}

const preferences = usePreferencesStore()
const session = useSessionStore()

const rows = computed<CostRow[]>(() => {
  return session.subscriptions
    .filter((subscription) => subscription.participatesInBudget)
    .map((subscription) => ({
      subscription,
      monthlyAmount: monthlyEquivalentAmount(subscription),
    }))
    .sort((left, right) => {
      const currencyOrder = left.subscription.billingAmount.currencyCode.localeCompare(
        right.subscription.billingAmount.currencyCode,
      )
      if (currencyOrder !== 0) {
        return currencyOrder
      }

      return right.monthlyAmount - left.monthlyAmount
    })
})

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

function formatMonthly(subscription: Subscription, amount: number): string {
  return formatMoney(
    {
      ...subscription.billingAmount,
      amount,
    },
    preferences.resolvedLocale,
  )
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_Cost") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_CostSubtitle") }}
      </p>
    </div>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Subscriptions_NoDataTitle')"
      :description="preferences.t('Subscriptions_NoDataDescription')"
    />

    <template v-else>
      <p v-if="session.excludedCount > 0" class="text-muted-foreground text-sm">
        {{ preferences.t("Forecast_ExcludedSubscriptions", session.excludedCount) }}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{{ preferences.t("Cost_Title") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <EmptyState
            v-if="session.monthlyCostTotals.length === 0"
            :title="preferences.t('Cost_EmptyTitle')"
            :description="preferences.t('Cost_EmptyDescription')"
          />
          <div
            v-for="total in session.monthlyCostTotals"
            :key="`${total.currencyCode}-${total.currencyKind}`"
            class="flex items-start justify-between gap-3 rounded-lg border p-3"
          >
            <p class="font-medium">{{ total.currencyCode }}</p>
            <p class="text-right font-semibold">{{ formatTotal(total) }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ preferences.t("Cost_BreakdownTitle") }}</CardTitle>
          <CardDescription>{{ preferences.t("Cost_BreakdownDescription") }}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            v-if="rows.length === 0"
            :title="preferences.t('Cost_EmptyTitle')"
            :description="preferences.t('Cost_EmptyDescription')"
          />
          <div v-else class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ preferences.t("Column_Provider") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_Service") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_Cycle") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_Amount") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_MonthlyCost") }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in rows" :key="row.subscription.id">
                  <TableCell class="font-medium">{{ row.subscription.providerName }}</TableCell>
                  <TableCell>{{ row.subscription.serviceName }}</TableCell>
                  <TableCell>
                    {{
                      cycleLabel(
                        preferences.resolvedLocale,
                        row.subscription.intervalUnit,
                        row.subscription.intervalCount,
                      )
                    }}
                  </TableCell>
                  <TableCell>
                    {{ formatMoney(row.subscription.billingAmount, preferences.resolvedLocale) }}
                  </TableCell>
                  <TableCell>
                    {{ formatMonthly(row.subscription, row.monthlyAmount) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
