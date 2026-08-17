import { toast } from "vue-sonner"

import { downloadCsv } from "@/csv/file"
import { createSampleSubscriptions, SAMPLE_CSV_FILE_NAME } from "@/csv/sample"
import { serializeSubscriptionCsv } from "@/csv/write"
import { usePreferencesStore } from "@/stores/preferences"

export function useCsvSampleDownload() {
  const preferences = usePreferencesStore()

  function downloadSampleCsv(): void {
    try {
      const subscriptions = createSampleSubscriptions()
      const csvText = serializeSubscriptionCsv(subscriptions, false)
      downloadCsv(SAMPLE_CSV_FILE_NAME, csvText)
      toast.success(preferences.t("Status_CsvSampleDownloaded", subscriptions.length))
    } catch (error) {
      console.error("Failed to download the sample CSV.", error)
      toast.error(preferences.t("Status_CsvSampleFailed"))
    }
  }

  return { downloadSampleCsv }
}
