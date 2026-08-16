<script setup lang="ts">
import { AlertCircle } from "@lucide/vue"
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
import { parseSubscriptionCsv, toSubscriptions } from "@/csv/parse"
import { CSV_MAXIMUM_FILE_SIZE, type CsvParseResult } from "@/domain/types"
import { issueMessage } from "@/i18n/format"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

const open = defineModel<boolean>("open", { default: false })

const preferences = usePreferencesStore()
const session = useSessionStore()
const fileInput = ref<HTMLInputElement | null>(null)
const parseResult = ref<CsvParseResult | null>(null)
const selectedName = ref<string | null>(null)
const isReading = ref(false)

const preview = computed(() => parseResult.value?.preview ?? null)

watch(open, (isOpen) => {
  if (!isOpen) {
    resetPreview()
  }
})

function resetPreview(): void {
  parseResult.value = null
  selectedName.value = null
  isReading.value = false
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
  if (!file) {
    return
  }

  if (file.size > CSV_MAXIMUM_FILE_SIZE) {
    toast.error(preferences.t("Status_CsvTooLarge"))
    resetPreview()
    return
  }

  isReading.value = true
  try {
    const text = await file.text()
    parseResult.value = parseSubscriptionCsv(text)
    selectedName.value = file.name
  } catch (error) {
    console.error("Failed to read the CSV file.", error)
    toast.error(preferences.t("Status_CsvPreviewFailed"))
    resetPreview()
  } finally {
    isReading.value = false
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
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[90vh] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ preferences.t("Settings_ImportDialogTitle") }}</DialogTitle>
        <DialogDescription>
          {{ preferences.t("Settings_ImportCsvToolTip") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            class="sr-only"
            @change="onFileChange"
          >
          <Button type="button" variant="outline" :disabled="isReading" @click="chooseFile">
            {{ preferences.t("Import_ChooseFile") }}
          </Button>
          <p v-if="selectedName" class="text-muted-foreground truncate text-sm">
            {{ selectedName }}
          </p>
        </div>

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
        <Button type="button" variant="outline" @click="open = false">
          {{ preferences.t("Common_Cancel") }}
        </Button>
        <Button type="button" :disabled="!preview?.canImport" @click="confirmImport">
          {{ preferences.t("Settings_ConfirmImport") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
