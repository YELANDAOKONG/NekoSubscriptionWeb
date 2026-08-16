import type { MessageKey } from "@/i18n/locales/en"

export const PROJECT_REPOSITORY_URL = "https://github.com/YELANDAOKONG/NekoSubscriptionWeb"

export const CSV_FORMAT_COLUMNS: ReadonlyArray<{
  index: number
  header: string
  description: MessageKey
}> = [
  { index: 1, header: "SERVICE NAME", description: "About_CsvCol1" },
  { index: 2, header: "MEMBERSHIP NAME", description: "About_CsvCol2" },
  { index: 3, header: "ACCOUNT IDENTIFIER", description: "About_CsvCol3" },
  { index: 4, header: "PERIODIC FEE", description: "About_CsvCol4" },
  { index: 5, header: "CURRENCY", description: "About_CsvCol5" },
  { index: 6, header: "PAYMENT CYCLE", description: "About_CsvCol6" },
  { index: 7, header: "EFFECTIVE DATE", description: "About_CsvCol7" },
  { index: 8, header: "EXPIRATION DATE", description: "About_CsvCol8" },
  { index: 9, header: "REMAINING VALIDITY", description: "About_CsvCol9" },
  { index: 10, header: "SUBSCRIPTION MARKER", description: "About_CsvCol10" },
  { index: 11, header: "PAYMENT METHOD", description: "About_CsvCol11" },
  { index: 12, header: "PAYMENT ACCOUNT", description: "About_CsvCol12" },
  { index: 13, header: "NOTES", description: "About_CsvCol13" },
]
