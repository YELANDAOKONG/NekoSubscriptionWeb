import Papa from "papaparse"

import { parseSupportedDate } from "@/domain/dates"
import {
  CSV_COLUMN_COUNT,
  MISSING_CURRENCY_CODE,
  MAXIMUM_CURRENCY_CODE_LENGTH,
  type BillingIntervalUnit,
  type CsvImportIssue,
  type CsvImportIssueCode,
  type CsvParseResult,
  type ImportedSubscriptionRow,
  type Money,
  type PaymentChannel,
  type Subscription,
} from "@/domain/types"

type BillingInterval = {
  unit: BillingIntervalUnit
  count: number
}

export function parseSubscriptionCsv(csvText: string): CsvParseResult {
  const text = csvText.replace(/^\uFEFF/, "")
  const parsed = Papa.parse<string[]>(text, {
    delimiter: ",",
    header: false,
    skipEmptyLines: false,
    quoteChar: '"',
    escapeChar: '"',
    dynamicTyping: false,
  })

  const rows: ImportedSubscriptionRow[] = []
  const issues: CsvImportIssue[] = []
  const duplicateKeys = new Set<string>()
  let headerWasRead = false
  let totalRowCount = 0

  const quoteError = parsed.errors.find((error) => error.type === "Quotes")
  if (quoteError) {
    issues.push(createIssue(Math.max(quoteError.row ?? 0, 1) + 1, "error", "malformed_csv"))
    return createResult(rows, totalRowCount, issues)
  }

  for (let index = 0; index < parsed.data.length; index++) {
    const rowNumber = index + 1
    const fields = parsed.data[index] ?? []
    if (isBlankRow(fields)) {
      continue
    }

    if (!headerWasRead) {
      headerWasRead = true
      continue
    }

    totalRowCount++
    if (!hasValidColumnCount(fields)) {
      issues.push(createIssue(rowNumber, "error", "invalid_column_count"))
      continue
    }

    const importedRow = tryParseRow(fields, rowNumber, issues)
    if (importedRow === null) {
      continue
    }

    const duplicateKey = createDuplicateKey(importedRow)
    if (duplicateKeys.has(duplicateKey)) {
      issues.push(createIssue(rowNumber, "warning", "duplicate_row"))
    } else {
      duplicateKeys.add(duplicateKey)
    }

    rows.push(importedRow)
  }

  return createResult(rows, totalRowCount, issues)
}

export function toSubscriptions(rows: ImportedSubscriptionRow[]): Subscription[] {
  return rows.map((row) => ({
    id: crypto.randomUUID(),
    providerName: row.providerName,
    serviceName: row.serviceName,
    accountName: row.accountName,
    billingAmount: row.billingAmount,
    intervalUnit: row.intervalUnit,
    intervalCount: row.intervalCount,
    startsOn: row.startsOn,
    nextBillingOn: row.nextBillingOn,
    isActive: row.isActive,
    participatesInBudget: row.isActive,
    paymentChannel: row.paymentChannel,
    paymentAccount: row.paymentAccount,
    notes: row.notes,
  }))
}

function tryParseRow(
  fields: string[],
  rowNumber: number,
  issues: CsvImportIssue[],
): ImportedSubscriptionRow | null {
  const issueCount = issues.length
  const providerName = normalizeOptional(fields[0])
  if (providerName === null) {
    addError(issues, rowNumber, "missing_provider")
  }

  const serviceName = normalizeOptional(fields[1]) ?? providerName
  const accountName = normalizeOptional(fields[2])
  const billingAmount = parseMoney(fields[3], fields[4], rowNumber, issues)
  const interval = parseBillingInterval(fields[5], rowNumber, issues)
  const startsOn = parseDate(fields[6], rowNumber, issues)
  const nextBillingOn = parseDate(fields[7], rowNumber, issues)
  if (startsOn !== null && nextBillingOn !== null && nextBillingOn < startsOn) {
    addError(issues, rowNumber, "invalid_date_order")
  }

  const isActive = parseSubscriptionMarker(fields[9], rowNumber, issues)
  const paymentChannel = parsePaymentChannel(fields[10], rowNumber, issues)
  let paymentAccount = normalizeOptional(fields[11])
  if (paymentAccount === "-") {
    paymentAccount = null
  }

  if (
    (paymentChannel === "apple" || paymentChannel === "google" || paymentChannel === "paypal") &&
    paymentAccount === null
  ) {
    addError(issues, rowNumber, "missing_payment_account")
  }

  if (
    issues.length !== issueCount ||
    providerName === null ||
    serviceName === null ||
    billingAmount === null ||
    interval === null ||
    isActive === null ||
    paymentChannel === null
  ) {
    return null
  }

  return {
    providerName,
    serviceName,
    accountName,
    billingAmount,
    intervalUnit: interval.unit,
    intervalCount: interval.count,
    startsOn,
    nextBillingOn,
    isActive,
    paymentChannel,
    paymentAccount,
    notes: normalizeOptional(fields[12]),
  }
}

function parseMoney(
  amountText: string,
  currencyText: string,
  rowNumber: number,
  issues: CsvImportIssue[],
): Money | null {
  const normalizedAmount = normalizeOptional(amountText)
  const normalizedCurrency = normalizeOptional(currencyText)?.toUpperCase() ?? null
  if (normalizedAmount === null && normalizedCurrency === null) {
    return {
      amount: 0,
      currencyCode: MISSING_CURRENCY_CODE,
      currencyKind: "iso4217",
    }
  }

  const amount = parseInvariantDecimal(normalizedAmount)
  if (normalizedAmount === null || normalizedCurrency === null || amount === null || amount < 0) {
    addError(issues, rowNumber, "invalid_amount_or_currency")
    return null
  }

  const currencyCode = normalizedCurrency
  if (
    currencyCode.length > MAXIMUM_CURRENCY_CODE_LENGTH ||
    !/^[A-Z0-9]+$/.test(currencyCode)
  ) {
    addError(issues, rowNumber, "invalid_amount_or_currency")
    return null
  }

  const currencyKind =
    currencyCode.length === 3 && /^[A-Z]+$/.test(currencyCode) ? "iso4217" : "custom"

  return {
    amount,
    currencyCode,
    currencyKind,
  }
}

function parseBillingInterval(
  value: string,
  rowNumber: number,
  issues: CsvImportIssue[],
): BillingInterval | null {
  const normalizedValue = normalizeOptional(value)?.toUpperCase()
  const interval = intervalFromCode(normalizedValue)
  if (interval === null) {
    addError(issues, rowNumber, "invalid_billing_period")
  }

  return interval
}

function intervalFromCode(value: string | undefined): BillingInterval | null {
  switch (value) {
    case "D":
      return { unit: "day", count: 1 }
    case "W":
      return { unit: "week", count: 1 }
    case "M":
      return { unit: "month", count: 1 }
    case "Q":
      return { unit: "month", count: 3 }
    case "HY":
      return { unit: "month", count: 6 }
    case "Y":
      return { unit: "year", count: 1 }
    default:
      return null
  }
}

function parseDate(
  value: string,
  rowNumber: number,
  issues: CsvImportIssue[],
): string | null {
  const normalizedValue = normalizeOptional(value)
  if (normalizedValue === null) {
    return null
  }

  const date = parseSupportedDate(normalizedValue)
  if (date === null) {
    addError(issues, rowNumber, "invalid_date")
  }

  return date
}

function parseSubscriptionMarker(
  value: string,
  rowNumber: number,
  issues: CsvImportIssue[],
): boolean | null {
  const normalizedValue = normalizeOptional(value)
  if (normalizedValue === null) {
    addError(issues, rowNumber, "invalid_subscription_marker")
    return null
  }

  if (/^true$/i.test(normalizedValue) || normalizedValue === "1") {
    return true
  }

  if (/^false$/i.test(normalizedValue) || normalizedValue === "0") {
    return false
  }

  addError(issues, rowNumber, "invalid_subscription_marker")
  return null
}

function parsePaymentChannel(
  value: string,
  rowNumber: number,
  issues: CsvImportIssue[],
): PaymentChannel | null {
  const normalizedValue = normalizeOptional(value)?.toUpperCase()
  const paymentChannel = channelFromCode(normalizedValue)
  if (paymentChannel === null) {
    addError(issues, rowNumber, "invalid_payment_channel")
  }

  return paymentChannel
}

function channelFromCode(value: string | undefined): PaymentChannel | null {
  switch (value) {
    case "DIRECT":
      return "direct"
    case "APPLE":
      return "apple"
    case "GOOGLE":
      return "google"
    case "PAYPAL":
      return "paypal"
    case "BANK":
      return "bank"
    case "CREDIT_CARD":
      return "credit_card"
    case "DEBIT_CARD":
      return "debit_card"
    case "CASH":
      return "cash"
    case "OTHER":
      return "other"
    default:
      return null
  }
}

function createDuplicateKey(row: ImportedSubscriptionRow): string {
  return [
    row.providerName,
    row.serviceName,
    row.accountName ?? "",
    String(row.billingAmount.amount),
    row.billingAmount.currencyCode,
    row.nextBillingOn ?? "",
  ].join("\u001F").toUpperCase()
}

function hasValidColumnCount(fields: string[]): boolean {
  if (fields.length < CSV_COLUMN_COUNT) {
    return false
  }

  return fields.slice(CSV_COLUMN_COUNT).every((field) => field.trim() === "")
}

function isBlankRow(fields: string[]): boolean {
  return fields.length === 0 || fields.every((field) => field.trim() === "")
}

function parseInvariantDecimal(value: string | null): number | null {
  if (value === null) {
    return null
  }

  const normalized = value.replace(/,/g, "")
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

function normalizeOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function addError(
  issues: CsvImportIssue[],
  rowNumber: number,
  code: CsvImportIssueCode,
): void {
  issues.push(createIssue(rowNumber, "error", code))
}

function createIssue(
  rowNumber: number,
  severity: CsvImportIssue["severity"],
  code: CsvImportIssueCode,
): CsvImportIssue {
  return { rowNumber, severity, code }
}

function createResult(
  rows: ImportedSubscriptionRow[],
  totalRowCount: number,
  issues: CsvImportIssue[],
): CsvParseResult {
  const errorCount = issues.filter((issue) => issue.severity === "error").length
  const warningCount = issues.filter((issue) => issue.severity === "warning").length
  return {
    rows,
    preview: {
      totalRowCount,
      validRowCount: rows.length,
      errorCount,
      warningCount,
      canImport: rows.length > 0 && errorCount === 0,
      issues,
    },
  }
}
