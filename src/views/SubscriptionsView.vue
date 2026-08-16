<script setup lang="ts">
import { computed, ref } from "vue"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import EmptyState from "@/components/EmptyState.vue"
import { cycleLabel, formatIsoDate, formatMoney, paymentChannelLabel } from "@/i18n/format"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"
import {
  DEFAULT_SUBSCRIPTION_SORT,
  isSubscriptionSortOption,
  sortSubscriptions,
  SUBSCRIPTION_SORT_LABELS,
  SUBSCRIPTION_SORT_OPTIONS,
} from "@/subscriptions/sort"

const preferences = usePreferencesStore()
const session = useSessionStore()
const query = ref("")
const sort = ref(DEFAULT_SUBSCRIPTION_SORT)

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const matched =
    needle === ""
      ? session.subscriptions
      : session.subscriptions.filter((subscription) => {
          const haystack = [
            subscription.providerName,
            subscription.serviceName,
            subscription.accountName ?? "",
            subscription.isActive
              ? preferences.t("Status_Active")
              : preferences.t("Status_Inactive"),
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(needle)
        })

  return sortSubscriptions(matched, sort.value, preferences.resolvedLocale)
})

const countLabel = computed(() => {
  const count = filtered.value.length
  return count === 1
    ? preferences.t("Subscriptions_CountOne")
    : preferences.t("Subscriptions_CountMany", count)
})

function onSortChange(value: unknown): void {
  if (isSubscriptionSortOption(value)) {
    sort.value = value
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_Subscriptions") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_SubscriptionsSubtitle") }}
      </p>
    </div>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Subscriptions_NoDataTitle')"
      :description="preferences.t('Subscriptions_NoDataDescription')"
    />

    <template v-else>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            v-model="query"
            :placeholder="preferences.t('Subscriptions_SearchPlaceholder')"
            class="sm:max-w-sm"
          />
          <div class="flex min-w-0 items-center">
            <Label for="subscription-sort" class="sr-only">
              {{ preferences.t("Subscriptions_SortLabel") }}
            </Label>
            <Select :model-value="sort" @update:model-value="onSortChange">
              <SelectTrigger id="subscription-sort" class="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in SUBSCRIPTION_SORT_OPTIONS" :key="option" :value="option">
                  {{ preferences.t(SUBSCRIPTION_SORT_LABELS[option]) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p class="text-muted-foreground text-sm">{{ countLabel }}</p>
      </div>

      <EmptyState
        v-if="filtered.length === 0"
        :title="preferences.t('Subscriptions_EmptyTitle')"
        :description="preferences.t('Subscriptions_EmptyDescription')"
      />

      <div v-else class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ preferences.t("Column_Provider") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Service") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ preferences.t("Column_Account") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Amount") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ preferences.t("Column_Cycle") }}</TableHead>
              <TableHead class="hidden sm:table-cell">{{ preferences.t("Column_NextBilling") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Status") }}</TableHead>
              <TableHead class="hidden xl:table-cell">{{ preferences.t("Column_PaymentChannel") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="subscription in filtered" :key="subscription.id">
              <TableCell class="font-medium">{{ subscription.providerName }}</TableCell>
              <TableCell>
                <div class="flex flex-col">
                  <span>{{ subscription.serviceName }}</span>
                  <span class="text-muted-foreground md:hidden text-xs">
                    {{ subscription.accountName ?? preferences.t("Common_Unknown") }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="hidden md:table-cell">
                {{ subscription.accountName ?? preferences.t("Common_Unknown") }}
              </TableCell>
              <TableCell class="whitespace-nowrap">
                {{ formatMoney(subscription.billingAmount, preferences.resolvedLocale) }}
              </TableCell>
              <TableCell class="hidden lg:table-cell">
                {{ cycleLabel(preferences.resolvedLocale, subscription.intervalUnit, subscription.intervalCount) }}
              </TableCell>
              <TableCell class="hidden sm:table-cell">
                {{
                  subscription.nextBillingOn
                    ? formatIsoDate(subscription.nextBillingOn, preferences.resolvedLocale)
                    : preferences.t("Common_NotScheduled")
                }}
              </TableCell>
              <TableCell>
                <Badge :variant="subscription.isActive ? 'default' : 'secondary'">
                  {{ subscription.isActive ? preferences.t("Status_Active") : preferences.t("Status_Inactive") }}
                </Badge>
              </TableCell>
              <TableCell class="hidden xl:table-cell">
                {{ paymentChannelLabel(preferences.resolvedLocale, subscription.paymentChannel) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>
