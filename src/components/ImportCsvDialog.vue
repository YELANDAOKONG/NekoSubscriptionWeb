<script setup lang="ts">
import { AlertCircle, FileUp } from "@lucide/vue"
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

const { importOpen, queuedFile, takeQueuedFile } = useCsvImport()
const preferences = usePreferencesStore()
const session = useSessionStore()
const fileInput = ref<HTMLInputElement | null>(null)
const parseResult = ref<CsvParseResult | null>(null)
const selectedName = ref<string | null>(null)
const isReading = ref(false)
const isDialogDragging = ref(false)

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
  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

function chooseFile(): void {
  fileInput.value?.click()
}

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

function onDialogDragOver(event: DragEvent): void {
  event.preventDefault()
  isDialogDragging.value = true
}

function onDialogDragLeave(): void {
  isDialogDragging.value = false
}

async function onDialogDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
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
    <DialogContent class="flex max-h-[90vh] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ preferences.t("Settings_ImportDialogTitle") }}</DialogTitle>
        <DialogDescription>
          {{ preferences.t("Settings_ImportCsvToolTip") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="sr-only"
          @change="onFileChange"
        >
        <button
          type="button"
          :disabled="isReading"
          :class="cn(
            'hover:bg-accent/40 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            isDialogDragging ? 'border-primary bg-accent/60' : 'border-muted-foreground/30',
          )"
          @click="chooseFile"
          @dragover="onDialogDragOver"
          @dragleave="onDialogDragLeave"
          @drop="onDialogDrop"
        >
          <FileUp class="text-muted-foreground size-8" />
          <span class="text-sm font-medium">
            {{ isDialogDragging ? preferences.t("Import_DropActive") : preferences.t("Import_DropHint") }}
          </span>
          <span v-if="selectedName" class="text-muted-foreground max-w-full truncate text-xs">
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
                    {{ preferences.t("Settings_ImportIssueLine", issue.rowNumber, issueMessage(preferences.resolvedLocale, issue.code)) }}
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
        <Button type="button" :disabled="!preview?.canImport" @click="confirmImport">
          {{ preferences.t("Settings_ConfirmImport") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
