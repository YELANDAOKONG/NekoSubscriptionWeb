import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from "vue-router"

import { DEFAULT_FORECAST_DAYS, FORECAST_PERIODS } from "@/domain/types"
import type { MessageKey } from "@/i18n/locales/en"
import type { SubscriptionSortOption } from "@/subscriptions/sort"
import { isSubscriptionSortOption } from "@/subscriptions/sort"

export const SUBSCRIPTION_STATUS_FILTERS = ["all", "active", "inactive"] as const
export type SubscriptionStatusFilter = (typeof SUBSCRIPTION_STATUS_FILTERS)[number]

export type ListLayout = "table" | "cards"

export const ANALYSIS_ROW_LINK_CLASS =
  "hover:bg-muted/50 focus-visible:bg-muted/50 flex items-start justify-between gap-3 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"

export const ANALYSIS_CARD_LINK_CLASS =
  "flex flex-col gap-3 rounded-lg border p-3 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50"

export const ANALYSIS_CELL_LINK_CLASS =
  "hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"

export const ANALYSIS_METRIC_LINK_CLASS =
  "inline-block rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"

export function pageTitleKey(routeName: string | symbol | null | undefined): MessageKey {
  switch (routeName) {
    case "cost":
      return "Nav_Cost"
    case "subscriptions":
      return "Nav_Subscriptions"
    case "calendar":
      return "Nav_Calendar"
    case "settings":
      return "Nav_Settings"
    case "about":
      return "Nav_About"
    default:
      return "Nav_Overview"
  }
}

export function queryParam(value: unknown): string | undefined {
  if (typeof value === "string" && value !== "") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0] !== "") {
    return value[0]
  }

  return undefined
}

export function compactQuery(
  current: LocationQuery,
  patch: Record<string, string | undefined>,
): LocationQueryRaw {
  const next: LocationQueryRaw = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") {
      delete next[key]
    } else {
      next[key] = value
    }
  }

  return next
}

export function parseForecastDays(value: unknown): (typeof FORECAST_PERIODS)[number] | null {
  const raw = queryParam(value)
  if (raw === undefined) {
    return null
  }

  const days = Number(raw)
  return (FORECAST_PERIODS as readonly number[]).includes(days)
    ? (days as (typeof FORECAST_PERIODS)[number])
    : null
}

export function forecastDaysQueryValue(days: number): string | undefined {
  return days === DEFAULT_FORECAST_DAYS ? undefined : String(days)
}

export function parseListLayout(value: unknown): ListLayout | null {
  const raw = queryParam(value)
  if (raw === "table" || raw === "cards") {
    return raw
  }

  return null
}

export function parseSubscriptionStatus(value: unknown): SubscriptionStatusFilter {
  const raw = queryParam(value)
  if (raw === "active" || raw === "inactive") {
    return raw
  }

  return "all"
}

export function parseSubscriptionSort(value: unknown): SubscriptionSortOption | null {
  const raw = queryParam(value)
  return isSubscriptionSortOption(raw) ? raw : null
}

export function calendarLocation(date: string): RouteLocationRaw {
  return { name: "calendar", query: { date } }
}

export function subscriptionsLocation(options?: {
  status?: Exclude<SubscriptionStatusFilter, "all">
}): RouteLocationRaw {
  return {
    name: "subscriptions",
    query: options?.status === undefined ? undefined : { status: options.status },
  }
}

export function subscriptionCalendarDate(subscription: {
  nextBillingOn: string | null
  startsOn: string | null
}): string | null {
  return subscription.nextBillingOn ?? subscription.startsOn
}
