import { parseSubscriptionCsv } from "@/csv/parse"
import { CSV_MAXIMUM_FILE_SIZE, type CsvParseResult } from "@/domain/types"

export type CsvFileLoadFailure = "too_large" | "unreadable" | "invalid_type"

export type CsvFileLoadResult =
  | { ok: true; result: CsvParseResult; fileName: string }
  | { ok: false; reason: CsvFileLoadFailure }

export function isCsvFile(file: File): boolean {
  const fileName = file.name.toLowerCase()
  if (fileName.endsWith(".csv")) {
    return true
  }

  return file.type === "text/csv" || file.type === "application/csv"
}

export function fileFromDropEvent(event: DragEvent): File | null {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) {
    return null
  }

  return files[0] ?? null
}

export function dropEventHasFiles(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) {
    return false
  }

  return Array.from(types).includes("Files")
}

export async function loadCsvFile(file: File): Promise<CsvFileLoadResult> {
  if (!isCsvFile(file)) {
    return { ok: false, reason: "invalid_type" }
  }

  if (file.size > CSV_MAXIMUM_FILE_SIZE) {
    return { ok: false, reason: "too_large" }
  }

  try {
    const text = await file.text()
    return {
      ok: true,
      result: parseSubscriptionCsv(text),
      fileName: file.name,
    }
  } catch (error) {
    console.error("Failed to read the CSV file.", error)
    return { ok: false, reason: "unreadable" }
  }
}
