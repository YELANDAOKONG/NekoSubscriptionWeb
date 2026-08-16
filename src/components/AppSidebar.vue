<script setup lang="ts">
import {
  CalendarDays,
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
  useSidebar,
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

const preferences = usePreferencesStore()
const session = useSessionStore()
const route = useRoute()
const { isMobile, state } = useSidebar()

const showCopy = computed(() => isMobile.value || state.value !== "collapsed")
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
        <SidebarMenuItem>
          <SidebarMenuButton
            as-child
            size="lg"
            class="group-data-[collapsible=icon]:p-2!"
            :is-active="route.name === 'settings'"
            :tooltip="preferences.t('Nav_Settings')"
          >
            <RouterLink to="/settings">
              <Settings />
              <div class="grid min-w-0 flex-1 text-left leading-tight">
                <span class="truncate">{{ preferences.t("Nav_Settings") }}</span>
                <span class="text-muted-foreground truncate text-xs">
                  {{ preferences.t("Nav_SettingsSubtitle") }}
                </span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <p
        v-if="showCopy"
        class="text-muted-foreground line-clamp-2 px-2 pb-1 text-xs leading-relaxed"
      >
        {{ session.sourceName ?? preferences.t("Brand_SessionOnly") }}
      </p>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
