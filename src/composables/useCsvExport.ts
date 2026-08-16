import { toast } from "vue-sonner"

import { downloadCsv } from "@/csv/file"
import { serializeSubscriptionCsv, subscriptionCsvFileName } from "@/csv/write"
import { usePreferencesStore } from "@/stores/preferences"
import { useSessionStore } from "@/stores/session"

export function useCsvExport() {
  const session = useSessionStore()
  const preferences = usePreferencesStore()

  function exportCsv(maskAccountIdentifiers: boolean): void {
    if (!session.hasData) {
      toast.error(preferences.t("Status_CsvExportFailed"))
      return
    }

    try {
      const csvText = serializeSubscriptionCsv(session.subscriptions, maskAccountIdentifiers)
      downloadCsv(subscriptionCsvFileName(session.sourceName, maskAccountIdentifiers), csvText)
      toast.success(preferences.t("Status_CsvExportCompleted", session.subscriptions.length))
    } catch (error) {
      console.error("Failed to export subscriptions to CSV.", error)
      toast.error(preferences.t("Status_CsvExportFailed"))
    }
  }

  return { exportCsv }
}
