<script setup lang="ts">
import {
  CalendarDays,
  LayoutDashboard,
  List,
  Settings,
} from "@lucide/vue"
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()
const route = useRoute()

const items = [
  { to: "/", name: "forecast", title: "Nav_Overview", subtitle: "Nav_OverviewSubtitle", icon: LayoutDashboard },
  { to: "/subscriptions", name: "subscriptions", title: "Nav_Subscriptions", subtitle: "Nav_SubscriptionsSubtitle", icon: List },
  { to: "/calendar", name: "calendar", title: "Nav_Calendar", subtitle: "Nav_CalendarSubtitle", icon: CalendarDays },
  { to: "/settings", name: "settings", title: "Nav_Settings", subtitle: "Nav_SettingsSubtitle", icon: Settings },
] as const
</script>

<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader class="px-2 py-3">
      <div class="flex items-center gap-2 px-2">
        <div class="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold">
          N
        </div>
        <div class="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
          <span class="truncate text-sm font-semibold">{{ preferences.t("App_Name") }}</span>
          <span class="text-muted-foreground truncate text-xs">{{ preferences.t("Brand_SessionOnly") }}</span>
        </div>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ preferences.t("App_Name") }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.to">
              <SidebarMenuButton
                as-child
                :is-active="route.name === item.name"
                :tooltip="preferences.t(item.title)"
              >
                <RouterLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ preferences.t(item.title) }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter class="group-data-[collapsible=icon]:hidden">
      <p class="text-muted-foreground px-2 pb-2 text-xs leading-relaxed">
        {{ preferences.t("Brand_SessionOnly") }}
      </p>
    </SidebarFooter>
  </Sidebar>
</template>
