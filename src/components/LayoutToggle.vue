<script setup lang="ts">
import { LayoutGrid, Table } from "@lucide/vue"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ListLayout } from "@/navigation"
import { usePreferencesStore } from "@/stores/preferences"

export type { ListLayout }

const layout = defineModel<ListLayout>({ required: true })
const preferences = usePreferencesStore()
</script>

<template>
  <Tabs v-model="layout" class="w-fit gap-0">
    <TabsList :aria-label="preferences.t('Layout_Toggle')">
      <TabsTrigger value="table" :aria-label="preferences.t('Layout_Table')">
        <Table />
        <span class="hidden sm:inline">{{ preferences.t("Layout_Table") }}</span>
      </TabsTrigger>
      <TabsTrigger value="cards" :aria-label="preferences.t('Layout_Cards')">
        <LayoutGrid />
        <span class="hidden sm:inline">{{ preferences.t("Layout_Cards") }}</span>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
