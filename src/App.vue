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
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="flex-1 p-4 md:p-6">
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
