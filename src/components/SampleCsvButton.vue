<script setup lang="ts">
import { Download } from "@lucide/vue"

import { Button } from "@/components/ui/button"
import { useCsvSampleDownload } from "@/composables/useCsvSampleDownload"
import { usePreferencesStore } from "@/stores/preferences"

withDefaults(
  defineProps<{
    variant?: "default" | "outline"
  }>(),
  { variant: "outline" },
)

const preferences = usePreferencesStore()
const { downloadSampleCsv } = useCsvSampleDownload()
</script>

<template>
  <Button :variant="variant" @click="downloadSampleCsv">
    <Download />
    {{ preferences.t("About_DownloadSample") }}
  </Button>
</template>
