<script setup lang="ts">
import {
  CalendarDays,
  Coins,
  Info,
  LayoutDashboard,
  Settings,
  Wallet,
} from "@lucide/vue"
import { computed } from "vue"
import { RouterLink, useRoute } from "vue-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { MessageKey } from "@/i18n/locales/en"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

type NavItem = {
  to: string
  name: string
  title: MessageKey
  subtitle: MessageKey
  icon: typeof LayoutDashboard
}

const primaryItems: NavItem[] = [
  {
    to: "/",
    name: "forecast",
    title: "Nav_Overview",
    subtitle: "Nav_OverviewSubtitle",
    icon: LayoutDashboard,
  },
  {
    to: "/cost",
    name: "cost",
    title: "Nav_Cost",
    subtitle: "Nav_CostSubtitle",
    icon: Coins,
  },
  {
    to: "/subscriptions",
    name: "subscriptions",
    title: "Nav_Subscriptions",
    subtitle: "Nav_SubscriptionsSubtitle",
    icon: Wallet,
  },
  {
    to: "/calendar",
    name: "calendar",
    title: "Nav_Calendar",
    subtitle: "Nav_CalendarSubtitle",
    icon: CalendarDays,
  },
]

const footerItems: NavItem[] = [
  {
    to: "/settings",
    name: "settings",
    title: "Nav_Settings",
    subtitle: "Nav_SettingsSubtitle",
    icon: Settings,
  },
  {
    to: "/about",
    name: "about",
    title: "Nav_About",
    subtitle: "Nav_AboutSubtitle",
    icon: Info,
  },
]
const preferences = usePreferencesStore()
const session = useSessionStore()
const route = useRoute()
const subscriptionCount = computed(() => session.subscriptions.length)

function itemTooltip(item: NavItem): string {
  const title = preferences.t(item.title)
  if (item.name === "subscriptions" && subscriptionCount.value > 0) {
    return `${title} (${subscriptionCount.value})`
  }

  return title
}
</script>

<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child :tooltip="preferences.t('App_Name')">
            <RouterLink to="/">
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                N
              </div>
              <div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ preferences.t("App_Name") }}</span>
                <span class="text-muted-foreground truncate text-xs">{{ preferences.t("Brand_Tagline") }}</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ preferences.t("Nav_Analyze") }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in primaryItems" :key="item.to">
              <SidebarMenuButton
                as-child
                size="lg"
                class="group-data-[collapsible=icon]:p-2!"
                :is-active="route.name === item.name"
                :tooltip="itemTooltip(item)"
              >
                <RouterLink :to="item.to">
                  <component :is="item.icon" />
                  <div class="grid min-w-0 flex-1 text-left leading-tight">
                    <span class="truncate">{{ preferences.t(item.title) }}</span>
                    <span class="text-muted-foreground truncate text-xs">
                      {{ preferences.t(item.subtitle) }}
                    </span>
                  </div>
                </RouterLink>
              </SidebarMenuButton>
              <SidebarMenuBadge v-if="item.name === 'subscriptions' && subscriptionCount > 0">
                {{ subscriptionCount }}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarSeparator class="mx-0" />
      <SidebarMenu>
        <SidebarMenuItem v-for="item in footerItems" :key="item.to">
          <SidebarMenuButton
            as-child
            size="lg"
            class="group-data-[collapsible=icon]:p-2!"
            :is-active="route.name === item.name"
            :tooltip="preferences.t(item.title)"
          >
            <RouterLink :to="item.to">
              <component :is="item.icon" />
              <div class="grid min-w-0 flex-1 text-left leading-tight">
                <span class="truncate">{{ preferences.t(item.title) }}</span>
                <span class="text-muted-foreground truncate text-xs">
                  {{ preferences.t(item.subtitle) }}
                </span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
