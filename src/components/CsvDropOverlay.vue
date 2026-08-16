<script setup lang="ts">
import { FileUp } from "@lucide/vue"
import { onMounted, onUnmounted, ref } from "vue"

import { dropEventHasFiles, fileFromDropEvent } from "@/csv/file"
import { useCsvImport } from "@/composables/useCsvImport"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()
const { openImport, importOpen } = useCsvImport()
const isDragging = ref(false)

function onDragOver(event: DragEvent): void {
  if (!dropEventHasFiles(event)) {
    return
  }

  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy"
  }
  isDragging.value = true
}

function onDragLeave(event: DragEvent): void {
  const leavingWindow =
    event.clientX <= 0 ||
    event.clientY <= 0 ||
    event.clientX >= window.innerWidth ||
    event.clientY >= window.innerHeight
  if (leavingWindow) {
    isDragging.value = false
  }
}

function onDrop(event: DragEvent): void {
  if (!dropEventHasFiles(event)) {
    return
  }

  event.preventDefault()
  isDragging.value = false
  const file = fileFromDropEvent(event)
  if (file) {
    openImport(file)
  }
}

onMounted(() => {
  window.addEventListener("dragover", onDragOver)
  window.addEventListener("dragleave", onDragLeave)
  window.addEventListener("drop", onDrop)
})

onUnmounted(() => {
  window.removeEventListener("dragover", onDragOver)
  window.removeEventListener("dragleave", onDragLeave)
  window.removeEventListener("drop", onDrop)
})
</script>

<template>
  <div
    v-if="isDragging && !importOpen"
    class="bg-background/80 fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm"
  >
    <div class="border-primary bg-card text-card-foreground flex max-w-md flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center shadow-lg">
      <FileUp class="text-primary size-10" />
      <p class="text-lg font-medium">{{ preferences.t("Import_DropActive") }}</p>
      <p class="text-muted-foreground text-sm">{{ preferences.t("Import_DropHint") }}</p>
    </div>
  </div>
</template>
