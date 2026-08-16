import { createRouter, createWebHistory } from "vue-router"

import ForecastView from "@/views/ForecastView.vue"

const AboutView = () => import("@/views/AboutView.vue")
const CalendarView = () => import("@/views/CalendarView.vue")
const CostView = () => import("@/views/CostView.vue")
const SettingsView = () => import("@/views/SettingsView.vue")
const SubscriptionsView = () => import("@/views/SubscriptionsView.vue")

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "forecast", component: ForecastView },
    { path: "/cost", name: "cost", component: CostView },
    { path: "/subscriptions", name: "subscriptions", component: SubscriptionsView },
    { path: "/calendar", name: "calendar", component: CalendarView },
    { path: "/settings", name: "settings", component: SettingsView },
    { path: "/about", name: "about", component: AboutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
