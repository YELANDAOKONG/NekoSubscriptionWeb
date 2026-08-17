<script setup lang="ts">
import { computed, ref } from "vue"
import { Coins, Upload } from "@lucide/vue"

import EmptyState from "@/components/EmptyState.vue"
import SampleCsvButton from "@/components/SampleCsvButton.vue"
import LayoutToggle, { type ListLayout } from "@/components/LayoutToggle.vue"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCsvImport } from "@/composables/useCsvImport"
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
const { openImport } = useCsvImport()
const layout = ref<ListLayout>("table")

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
    <p class="text-muted-foreground text-sm md:text-base">
      {{ preferences.t("Page_CostSubtitle") }}
    </p>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Empty_CostTitle')"
      :description="preferences.t('Empty_CostDescription')"
    >
      <template #icon>
        <Coins />
      </template>
      <div class="flex flex-wrap justify-center gap-2">
        <Button @click="openImport()">
          <Upload />
          {{ preferences.t("Settings_ImportCsv") }}
        </Button>
        <SampleCsvButton />
      </div>
    </EmptyState>

    <template v-else>
      <div>
        <p class="text-muted-foreground text-sm">{{ preferences.t("Cost_Title") }}</p>
        <div
          v-if="session.monthlyCostTotals.length > 0"
          class="mt-2 flex flex-col gap-1"
        >
          <p
            v-for="total in session.monthlyCostTotals"
            :key="`${total.currencyCode}-${total.currencyKind}`"
            class="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
          >
            {{ formatTotal(total) }}
          </p>
        </div>
        <p v-else class="text-muted-foreground mt-2 text-sm">
          {{ preferences.t("Cost_EmptyDescription") }}
        </p>
        <p v-if="session.excludedCount > 0" class="text-muted-foreground mt-2 text-sm">
          {{ preferences.t("Forecast_ExcludedSubscriptions", session.excludedCount) }}
        </p>
      </div>

      <section class="flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">{{ preferences.t("Cost_BreakdownTitle") }}</h2>
            <p class="text-muted-foreground text-sm">
              {{ preferences.t("Cost_BreakdownDescription") }}
            </p>
          </div>
          <LayoutToggle v-if="rows.length > 0" v-model="layout" />
        </div>
        <p
          v-if="rows.length === 0"
          class="text-muted-foreground text-sm"
        >
          {{ preferences.t("Cost_EmptyDescription") }}
        </p>
        <div v-else-if="layout === 'cards'" class="grid gap-3 md:grid-cols-2">
          <article
            v-for="row in rows"
            :key="row.subscription.id"
            class="flex flex-col gap-2 rounded-lg border p-3"
          >
            <div class="min-w-0">
              <p class="font-medium">{{ row.subscription.serviceName }}</p>
              <p class="text-muted-foreground truncate text-sm">{{ row.subscription.providerName }}</p>
            </div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt class="text-muted-foreground">{{ preferences.t("Column_Cycle") }}</dt>
              <dd class="text-right">
                {{
                  cycleLabel(
                    preferences.resolvedLocale,
                    row.subscription.intervalUnit,
                    row.subscription.intervalCount,
                  )
                }}
              </dd>
              <dt class="text-muted-foreground">{{ preferences.t("Column_Amount") }}</dt>
              <dd class="text-right tabular-nums">
                {{ formatMoney(row.subscription.billingAmount, preferences.resolvedLocale) }}
              </dd>
              <dt class="text-muted-foreground">{{ preferences.t("Column_MonthlyCost") }}</dt>
              <dd class="text-right font-medium tabular-nums">
                {{ formatMonthly(row.subscription, row.monthlyAmount) }}
              </dd>
            </dl>
          </article>
        </div>
        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="sticky left-0 z-10 bg-background">{{ preferences.t("Column_Provider") }}</TableHead>
                <TableHead>{{ preferences.t("Column_Service") }}</TableHead>
                <TableHead>{{ preferences.t("Column_Cycle") }}</TableHead>
                <TableHead>{{ preferences.t("Column_Amount") }}</TableHead>
                <TableHead>{{ preferences.t("Column_MonthlyCost") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in rows" :key="row.subscription.id" class="group">
                <TableCell class="sticky left-0 z-10 bg-background font-medium group-hover:bg-muted/50">
                  {{ row.subscription.providerName }}
                </TableCell>
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
                <TableCell class="tabular-nums">
                  {{ formatMoney(row.subscription.billingAmount, preferences.resolvedLocale) }}
                </TableCell>
                <TableCell class="tabular-nums">
                  {{ formatMonthly(row.subscription, row.monthlyAmount) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </template>
  </div>
</template>
