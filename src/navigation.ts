import type { RouteLocationRaw } from "vue-router"

import type { MessageKey } from "@/i18n/locales/en"

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

export function calendarLocation(date: string): RouteLocationRaw {
  return { name: "calendar", query: { date } }
}
