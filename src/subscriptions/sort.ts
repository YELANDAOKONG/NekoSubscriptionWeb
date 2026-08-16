import { compareIso } from "@/domain/dates"
import type { Subscription } from "@/domain/types"
import type { MessageKey } from "@/i18n/locales/en"
import { bcp47, type AppLocale } from "@/preferences/keys"

export const SUBSCRIPTION_SORT_OPTIONS = [
  "csv",
  "nextBillingAsc",
  "nextBillingDesc",
  "amountDesc",
  "amountAsc",
  "nameAsc",
  "nameDesc",
] as const

export type SubscriptionSortOption = (typeof SUBSCRIPTION_SORT_OPTIONS)[number]

export const DEFAULT_SUBSCRIPTION_SORT: SubscriptionSortOption = "csv"

export const SUBSCRIPTION_SORT_LABELS: Record<SubscriptionSortOption, MessageKey> = {
  csv: "Sort_CsvOrder",
  nextBillingAsc: "Sort_NextBillingAsc",
  nextBillingDesc: "Sort_NextBillingDesc",
  amountDesc: "Sort_AmountDesc",
  amountAsc: "Sort_AmountAsc",
  nameAsc: "Sort_NameAsc",
  nameDesc: "Sort_NameDesc",
}

export function isSubscriptionSortOption(value: unknown): value is SubscriptionSortOption {
  return typeof value === "string" && (SUBSCRIPTION_SORT_OPTIONS as readonly string[]).includes(value)
}

export function sortSubscriptions(
  subscriptions: readonly Subscription[],
  sort: SubscriptionSortOption,
  locale: AppLocale,
): Subscription[] {
  if (sort === "csv") {
    return [...subscriptions]
  }

  const nameLocale = bcp47(locale)
  return [...subscriptions].sort((left, right) => compareSubscriptions(left, right, sort, nameLocale))
}

function compareSubscriptions(
  left: Subscription,
  right: Subscription,
  sort: Exclude<SubscriptionSortOption, "csv">,
  nameLocale: string,
): number {
  switch (sort) {
    case "nextBillingAsc":
      return compareNextBilling(left.nextBillingOn, right.nextBillingOn, false) || compareServiceName(left, right, nameLocale)
    case "nextBillingDesc":
      return compareNextBilling(left.nextBillingOn, right.nextBillingOn, true) || compareServiceName(left, right, nameLocale)
    case "amountDesc":
      return compareAmount(right, left) || compareServiceName(left, right, nameLocale)
    case "amountAsc":
      return compareAmount(left, right) || compareServiceName(left, right, nameLocale)
    case "nameAsc":
      return compareServiceName(left, right, nameLocale)
    case "nameDesc":
      return compareServiceName(right, left, nameLocale)
  }
}

function compareNextBilling(left: string | null, right: string | null, descending: boolean): number {
  if (left === null && right === null) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  const order = compareIso(left, right)
  return descending ? -order : order
}

function compareAmount(left: Subscription, right: Subscription): number {
  return left.billingAmount.amount - right.billingAmount.amount
}

function compareServiceName(left: Subscription, right: Subscription, locale: string): number {
  return left.serviceName.localeCompare(right.serviceName, locale, { sensitivity: "base" })
}
