<script setup lang="ts">
import { watch } from "vue"
import { RouterView, useRoute } from "vue-router"

import AppHeader from "@/components/AppHeader.vue"
import AppSidebar from "@/components/AppSidebar.vue"
import CsvDropOverlay from "@/components/CsvDropOverlay.vue"
import ImportCsvDialog from "@/components/ImportCsvDialog.vue"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { pageTitleKey } from "@/navigation"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const preferences = usePreferencesStore()
const session = useSessionStore()
const route = useRoute()

watch(
  [
    () => route.name,
    () => preferences.resolvedLocale,
    () => session.sourceName,
  ],
  () => {
    const page = preferences.t(pageTitleKey(route.name))
    const app = preferences.t("App_Name")
    const file = session.sourceName
    document.title = file === null ? `${page} · ${app}` : `${page} · ${file} · ${app}`
  },
  { immediate: true },
)
</script>

<template>
  <a
    href="#main-content"
    class="bg-background text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[300] focus:rounded-md focus:px-3 focus:py-2 focus:ring-2"
  >
    {{ preferences.t("A11y_SkipToContent") }}
  </a>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div id="main-content" tabindex="-1" class="flex-1 scroll-mt-14 p-4 outline-none md:p-6">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <ImportCsvDialog />
  <CsvDropOverlay />
  <Toaster
    position="top-center"
    :theme="preferences.resolvedTheme"
    :rich-colors="true"
    close-button
  />
</template>
