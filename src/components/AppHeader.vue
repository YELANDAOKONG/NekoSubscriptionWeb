<script setup lang="ts">
import { ChevronDown, Download, EyeOff, Trash2, Upload } from "@lucide/vue"
import { computed, watch } from "vue"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCsvExport } from "@/composables/useCsvExport"
import { useCsvImport } from "@/composables/useCsvImport"
import { pageTitleKey } from "@/navigation"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const preferences = usePreferencesStore()
const session = useSessionStore()
const route = useRoute()
const { setOpenMobile } = useSidebar()
const { openImport } = useCsvImport()
const { exportCsv } = useCsvExport()

watch(() => route.fullPath, () => {
  setOpenMobile(false)
})

const pageTitle = computed(() => preferences.t(pageTitleKey(route.name)))

function clearSession(): void {
  session.clear()
  toast.success(preferences.t("Status_SessionCleared"))
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="h-4" />
    <div class="flex min-w-0 flex-1 flex-col">
      <h1 class="truncate text-sm font-medium">{{ pageTitle }}</h1>
      <p v-if="session.sourceName" class="text-muted-foreground truncate text-xs">
        {{ session.sourceName }}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="hidden sm:inline-flex"
            :disabled="!session.hasData"
            @click="clearSession"
          >
            <Trash2 />
            {{ preferences.t("Common_Clear") }}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ preferences.t("Settings_ClearImported") }}</TooltipContent>
      </Tooltip>
      <Button
        variant="outline"
        size="icon-sm"
        class="sm:hidden"
        :disabled="!session.hasData"
        :aria-label="preferences.t('Common_Clear')"
        @click="clearSession"
      >
        <Trash2 />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="max-sm:size-8 max-sm:px-0"
            :disabled="!session.hasData"
            :aria-label="preferences.t('Settings_ExportCsv')"
          >
            <Download />
            <span class="hidden sm:inline">{{ preferences.t("Settings_ExportCsv") }}</span>
            <ChevronDown class="hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="z-[100]">
          <DropdownMenuItem @click="exportCsv(false)">
            <Download />
            {{ preferences.t("Settings_ExportCsv") }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="exportCsv(true)">
            <EyeOff />
            {{ preferences.t("Settings_ExportCsvFuzzy") }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" class="hidden sm:inline-flex" @click="openImport()">
        <Upload />
        {{ preferences.t("Settings_ImportCsv") }}
      </Button>
      <Button
        size="icon-sm"
        class="sm:hidden"
        :aria-label="preferences.t('Settings_ImportCsv')"
        @click="openImport()"
      >
        <Upload />
      </Button>
    </div>
  </header>
</template>
