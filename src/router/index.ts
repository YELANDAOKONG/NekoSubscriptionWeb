import { createRouter, createWebHistory } from "vue-router"

import CalendarView from "@/views/CalendarView.vue"
import ForecastView from "@/views/ForecastView.vue"
import SettingsView from "@/views/SettingsView.vue"
import SubscriptionsView from "@/views/SubscriptionsView.vue"

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "forecast", component: ForecastView },
    { path: "/subscriptions", name: "subscriptions", component: SubscriptionsView },
    { path: "/calendar", name: "calendar", component: CalendarView },
    { path: "/settings", name: "settings", component: SettingsView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
