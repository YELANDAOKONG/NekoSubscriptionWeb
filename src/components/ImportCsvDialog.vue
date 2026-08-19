<script setup lang="ts">
import { AlertCircle, FileUp } from "@lucide/vue"
import { useEventListener } from "@vueuse/core"
import { computed, ref, watch } from "vue"
import { toast } from "vue-sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCsvImport } from "@/composables/useCsvImport"
import { loadCsvFile, type CsvFileLoadFailure } from "@/csv/file"
import { toSubscriptions } from "@/csv/parse"
import type { CsvParseResult } from "@/domain/types"
import type { MessageKey } from "@/i18n/locales/en"
import { issueMessage } from "@/i18n/format"
import { cn } from "@/lib/utils"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const { importOpen, queuedFile, takeQueuedFile, openImport } = useCsvImport()
const preferences = usePreferencesStore()
const session = useSessionStore()
const fileInput = ref<HTMLInputElement | null>(null)
const dropZone = ref<HTMLButtonElement | null>(null)
const parseResult = ref<CsvParseResult | null>(null)
const selectedName = ref<string | null>(null)
const isReading = ref(false)
const isDialogDragging = ref(false)
let dropZoneDragDepth = 0

const preview = computed(() => parseResult.value?.preview ?? null)

const loadFailureKeys: Record<CsvFileLoadFailure, MessageKey> = {
  too_large: "Status_CsvTooLarge",
  unreadable: "Status_CsvPreviewFailed",
  invalid_type: "Import_InvalidFileType",
}

watch(importOpen, async (isOpen) => {
  if (!isOpen) {
    resetPreview()
    return
  }

  const queued = takeQueuedFile()
  if (queued) {
    await applyFile(queued)
  }
})

watch(
  () => queuedFile.value,
  async (file) => {
    if (file === null || !importOpen.value) {
      return
    }

    const queued = takeQueuedFile()
    if (queued) {
      await applyFile(queued)
    }
  },
)

function resetPreview(): void {
  parseResult.value = null
  selectedName.value = null
  isReading.value = false
  isDialogDragging.value = false
  dropZoneDragDepth = 0
  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

function chooseFile(): void {
  fileInput.value?.click()
}

function onOpenAutoFocus(event: Event): void {
  if (!dropZone.value) {
    return
  }

  event.preventDefault()
  dropZone.value.focus()
}

function onImportShortcut(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey) {
    return
  }

  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "o") {
    return
  }

  event.preventDefault()
  if (importOpen.value) {
    chooseFile()
    return
  }

  openImport()
}

useEventListener(window, "keydown", onImportShortcut)

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await applyFile(file)
  }
}

async function applyFile(file: File): Promise<void> {
  isReading.value = true
  try {
    const loaded = await loadCsvFile(file)
    if (!loaded.ok) {
      toast.error(preferences.t(loadFailureKeys[loaded.reason]))
      resetPreview()
      return
    }

    parseResult.value = loaded.result
    selectedName.value = loaded.fileName
  } finally {
    isReading.value = false
  }
}

function onDialogDragEnter(event: DragEvent): void {
  event.preventDefault()
  dropZoneDragDepth += 1
  isDialogDragging.value = true
}

function onDialogDragOver(event: DragEvent): void {
  event.preventDefault()
}

function onDialogDragLeave(): void {
  dropZoneDragDepth = Math.max(0, dropZoneDragDepth - 1)
  if (dropZoneDragDepth === 0) {
    isDialogDragging.value = false
  }
}

async function onDialogDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  dropZoneDragDepth = 0
  isDialogDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await applyFile(file)
  }
}

function confirmImport(): void {
  const result = parseResult.value
  const fileName = selectedName.value
  if (result === null || fileName === null || !result.preview.canImport) {
    toast.error(preferences.t("Status_CsvImportFailed"))
    return
  }

  session.replaceSubscriptions(toSubscriptions(result.rows), fileName)
  toast.success(preferences.t("Status_CsvImportCompleted", result.rows.length))
  importOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="importOpen">
    <DialogContent
      class="flex max-h-[90vh] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden overscroll-contain sm:max-w-2xl"
      @open-auto-focus="onOpenAutoFocus"
    >
      <DialogHeader>
        <DialogTitle>{{ preferences.t("Settings_ImportDialogTitle") }}</DialogTitle>
        <DialogDescription>
          {{ preferences.t("Settings_ImportCsvToolTip") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain">
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="sr-only"
          @change="onFileChange"
        >
        <button
          ref="dropZone"
          type="button"
          :disabled="isReading"
          :aria-busy="isReading"
          :class="cn(
            'hover:bg-accent/40 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-[border-color,background-color,transform] duration-100 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
            isDialogDragging ? 'border-primary bg-accent/60' : 'border-muted-foreground/30',
          )"
          @click="chooseFile"
          @dragenter="onDialogDragEnter"
          @dragover="onDialogDragOver"
          @dragleave="onDialogDragLeave"
          @drop="onDialogDrop"
        >
          <Spinner v-if="isReading" class="size-8" />
          <FileUp v-else class="text-muted-foreground size-8" />
          <span class="text-sm font-medium">
            {{
              isReading
                ? preferences.t("Import_Reading")
                : isDialogDragging
                  ? preferences.t("Import_DropActive")
                  : preferences.t("Import_DropHint")
            }}
          </span>
          <span v-if="selectedName && !isReading" class="text-muted-foreground max-w-full truncate text-xs">
            {{ selectedName }}
          </span>
        </button>

        <template v-if="preview">
          <p class="text-sm">
            {{
              preferences.t(
                "Settings_ImportPreviewSummary",
                preview.validRowCount,
                preview.errorCount,
                preview.warningCount,
              )
            }}
          </p>

          <Alert v-if="!preview.canImport" variant="destructive">
            <AlertCircle />
            <AlertTitle>{{ preferences.t("Import_CannotImport") }}</AlertTitle>
            <AlertDescription>
              {{ preferences.t("Status_CsvImportFailed") }}
            </AlertDescription>
          </Alert>

          <div v-if="preview.issues.length > 0" class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ preferences.t("Column_Row") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_Status") }}</TableHead>
                  <TableHead>{{ preferences.t("Column_Issue") }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(issue, index) in preview.issues" :key="`${issue.rowNumber}-${index}`">
                  <TableCell>{{ issue.rowNumber }}</TableCell>
                  <TableCell>
                    <Badge :variant="issue.severity === 'error' ? 'destructive' : 'secondary'">
                      {{ preferences.t(issue.severity === "error" ? "Severity_Error" : "Severity_Warning") }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {{ issueMessage(preferences.resolvedLocale, issue.code) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="importOpen = false">
          {{ preferences.t("Common_Cancel") }}
        </Button>
        <Button type="button" :disabled="!preview?.canImport || isReading" @click="confirmImport">
          {{ preferences.t("Settings_ConfirmImport") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
