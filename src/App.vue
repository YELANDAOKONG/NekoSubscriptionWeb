<script setup lang="ts">
import { RouterView } from "vue-router"

import AppHeader from "@/components/AppHeader.vue"
import AppSidebar from "@/components/AppSidebar.vue"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()
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
    <Toaster :theme="preferences.resolvedTheme" rich-colors />
  </SidebarProvider>
</template>
