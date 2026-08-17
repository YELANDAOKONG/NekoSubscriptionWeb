<script setup lang="ts">
import { computed, ref } from "vue"
import { Search, Upload, Wallet, X } from "@lucide/vue"

import EmptyState from "@/components/EmptyState.vue"
import SampleCsvButton from "@/components/SampleCsvButton.vue"
import LayoutToggle from "@/components/LayoutToggle.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCsvImport } from "@/composables/useCsvImport"
import { useListLayout } from "@/composables/useListLayout"
import { monthlyEquivalentAmount } from "@/cashflow/cost"
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

const STATUS_FILTERS = ["all", "active", "inactive"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const preferences = usePreferencesStore()
const session = useSessionStore()
const { openImport } = useCsvImport()
const query = ref("")
const sort = ref(DEFAULT_SUBSCRIPTION_SORT)
const statusFilter = ref<StatusFilter>("all")
const { layout } = useListLayout()

const hasListConstraints = computed(
  () => query.value.trim() !== "" || statusFilter.value !== "all",
)

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
            subscription.paymentAccount ?? "",
            subscription.notes ?? "",
            paymentChannelLabel(preferences.resolvedLocale, subscription.paymentChannel),
            subscription.isActive
              ? preferences.t("Status_Active")
              : preferences.t("Status_Inactive"),
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(needle)
        })

  const byStatus =
    statusFilter.value === "all"
      ? matched
      : matched.filter((subscription) =>
          statusFilter.value === "active" ? subscription.isActive : !subscription.isActive,
        )

  return sortSubscriptions(byStatus, sort.value, preferences.resolvedLocale)
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

function onStatusFilterChange(value: string | number): void {
  if (value === "all" || value === "active" || value === "inactive") {
    statusFilter.value = value
  }
}

function clearSearch(): void {
  query.value = ""
}

function clearListConstraints(): void {
  query.value = ""
  statusFilter.value = "all"
}

function textOrUnknown(value: string | null): string {
  return value ?? preferences.t("Common_Unknown")
}

function dateLabel(iso: string | null, emptyKey: "Common_Unknown" | "Common_NotScheduled"): string {
  return iso === null
    ? preferences.t(emptyKey)
    : formatIsoDate(iso, preferences.resolvedLocale)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-muted-foreground text-sm md:text-base">
      {{ preferences.t("Page_SubscriptionsSubtitle") }}
    </p>

    <EmptyState
      v-if="!session.hasData"
      :title="preferences.t('Empty_SubscriptionsTitle')"
      :description="preferences.t('Empty_SubscriptionsDescription')"
    >
      <template #icon>
        <Wallet />
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
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup class="sm:max-w-sm">
              <InputGroupInput
                v-model="query"
                :placeholder="preferences.t('Subscriptions_SearchPlaceholder')"
                :aria-label="preferences.t('Subscriptions_SearchPlaceholder')"
              />
              <InputGroupAddon v-if="query.length > 0" align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  :aria-label="preferences.t('Subscriptions_ClearSearch')"
                  @click="clearSearch"
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
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
          <div class="flex flex-wrap items-center gap-2">
            <Tabs :model-value="statusFilter" class="w-fit gap-0" @update:model-value="onStatusFilterChange">
              <TabsList :aria-label="preferences.t('Subscriptions_FilterLabel')">
                <TabsTrigger value="all">{{ preferences.t("Subscriptions_FilterAll") }}</TabsTrigger>
                <TabsTrigger value="active">{{ preferences.t("Status_Active") }}</TabsTrigger>
                <TabsTrigger value="inactive">{{ preferences.t("Status_Inactive") }}</TabsTrigger>
              </TabsList>
            </Tabs>
            <LayoutToggle v-model="layout" />
            <p class="text-muted-foreground text-sm">{{ countLabel }}</p>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="filtered.length === 0"
        :title="preferences.t('Subscriptions_EmptyTitle')"
        :description="preferences.t('Subscriptions_EmptyDescription')"
      >
        <template #icon>
          <Search />
        </template>
        <Button v-if="hasListConstraints" variant="outline" @click="clearListConstraints">
          {{ preferences.t("Subscriptions_ClearFilters") }}
        </Button>
      </EmptyState>

      <div v-else-if="layout === 'cards'" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="subscription in filtered"
          :key="subscription.id"
          class="flex flex-col gap-3 rounded-lg border p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium">{{ subscription.serviceName }}</p>
              <p class="text-muted-foreground truncate text-sm">{{ subscription.providerName }}</p>
            </div>
            <Badge :variant="subscription.isActive ? 'default' : 'secondary'">
              {{ subscription.isActive ? preferences.t("Status_Active") : preferences.t("Status_Inactive") }}
            </Badge>
          </div>
          <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt class="text-muted-foreground">{{ preferences.t("Column_Amount") }}</dt>
            <dd class="text-right tabular-nums">
              {{ formatMoney(subscription.billingAmount, preferences.resolvedLocale) }}
            </dd>
            <dt class="text-muted-foreground">{{ preferences.t("Column_Cycle") }}</dt>
            <dd class="text-right">
              {{ cycleLabel(preferences.resolvedLocale, subscription.intervalUnit, subscription.intervalCount) }}
            </dd>
            <dt class="text-muted-foreground">{{ preferences.t("Column_MonthlyCost") }}</dt>
            <dd class="text-right tabular-nums">
              {{
                formatMoney(
                  {
                    ...subscription.billingAmount,
                    amount: monthlyEquivalentAmount(subscription),
                  },
                  preferences.resolvedLocale,
                )
              }}
            </dd>
            <dt class="text-muted-foreground">{{ preferences.t("Column_NextBilling") }}</dt>
            <dd class="text-right">{{ dateLabel(subscription.nextBillingOn, "Common_NotScheduled") }}</dd>
            <dt class="text-muted-foreground">{{ preferences.t("Column_Account") }}</dt>
            <dd class="truncate text-right">{{ textOrUnknown(subscription.accountName) }}</dd>
            <dt class="text-muted-foreground">{{ preferences.t("Column_PaymentChannel") }}</dt>
            <dd class="text-right">
              {{ paymentChannelLabel(preferences.resolvedLocale, subscription.paymentChannel) }}
            </dd>
          </dl>
          <p v-if="subscription.notes" class="text-muted-foreground text-sm whitespace-normal">
            {{ subscription.notes }}
          </p>
        </article>
      </div>

      <div v-else class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="sticky left-0 z-10 bg-background">{{ preferences.t("Column_Provider") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Service") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Account") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Amount") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Cycle") }}</TableHead>
              <TableHead>{{ preferences.t("Column_MonthlyCost") }}</TableHead>
              <TableHead>{{ preferences.t("Column_StartDate") }}</TableHead>
              <TableHead>{{ preferences.t("Column_NextBilling") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Status") }}</TableHead>
              <TableHead>{{ preferences.t("Column_PaymentChannel") }}</TableHead>
              <TableHead>{{ preferences.t("Column_PaymentAccount") }}</TableHead>
              <TableHead>{{ preferences.t("Column_Notes") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="subscription in filtered" :key="subscription.id" class="group">
              <TableCell class="sticky left-0 z-10 bg-background font-medium group-hover:bg-muted/50">
                {{ subscription.providerName }}
              </TableCell>
              <TableCell>{{ subscription.serviceName }}</TableCell>
              <TableCell>{{ textOrUnknown(subscription.accountName) }}</TableCell>
              <TableCell class="tabular-nums">
                {{ formatMoney(subscription.billingAmount, preferences.resolvedLocale) }}
              </TableCell>
              <TableCell>
                {{ cycleLabel(preferences.resolvedLocale, subscription.intervalUnit, subscription.intervalCount) }}
              </TableCell>
              <TableCell class="tabular-nums">
                {{
                  formatMoney(
                    {
                      ...subscription.billingAmount,
                      amount: monthlyEquivalentAmount(subscription),
                    },
                    preferences.resolvedLocale,
                  )
                }}
              </TableCell>
              <TableCell>{{ dateLabel(subscription.startsOn, "Common_Unknown") }}</TableCell>
              <TableCell>{{ dateLabel(subscription.nextBillingOn, "Common_NotScheduled") }}</TableCell>
              <TableCell>
                <Badge :variant="subscription.isActive ? 'default' : 'secondary'">
                  {{ subscription.isActive ? preferences.t("Status_Active") : preferences.t("Status_Inactive") }}
                </Badge>
              </TableCell>
              <TableCell>
                {{ paymentChannelLabel(preferences.resolvedLocale, subscription.paymentChannel) }}
              </TableCell>
              <TableCell>{{ textOrUnknown(subscription.paymentAccount) }}</TableCell>
              <TableCell class="max-w-72 whitespace-normal">
                {{ textOrUnknown(subscription.notes) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>
