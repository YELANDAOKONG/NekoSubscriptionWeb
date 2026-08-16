import { CSV_EXPORT_HEADERS } from "@/csv/format"
import type { BillingIntervalUnit, PaymentChannel, Subscription } from "@/domain/types"

// Match desktop StandardSubscriptionCsvWriter: UTF-8 BOM, CRLF, fixed uppercase
// headers, and *** on account identifier + payment account when masking.

const ACCOUNT_MASK = "***"
const MISSING_PAYMENT_ACCOUNT = "-"
const CSV_NEWLINE = "\r\n"
const UTF8_BOM = "\uFEFF"

const PAYMENT_CHANNEL_CODES: Record<PaymentChannel, string> = {
  direct: "DIRECT",
  apple: "APPLE",
  google: "GOOGLE",
  paypal: "PAYPAL",
  bank: "BANK",
  credit_card: "CREDIT_CARD",
  debit_card: "DEBIT_CARD",
  cash: "CASH",
  other: "OTHER",
}

export function serializeSubscriptionCsv(
  subscriptions: readonly Subscription[],
  maskAccountIdentifiers: boolean,
): string {
  const lines = [CSV_EXPORT_HEADERS.map((header) => escapeField(header)).join(",")]
  for (const subscription of subscriptions) {
    lines.push(createFields(subscription, maskAccountIdentifiers).map(escapeField).join(","))
  }

  return `${UTF8_BOM}${lines.join(CSV_NEWLINE)}${CSV_NEWLINE}`
}

export function subscriptionCsvFileName(
  sourceName: string | null,
  maskAccountIdentifiers: boolean,
): string {
  const fallback = "subscriptions.csv"
  const raw = sourceName?.trim() || fallback
  const withoutPath = raw.replace(/^.*[/\\]/, "")
  const sanitized = withoutPath.replace(/[<>:"|?*\u0000-\u001f]/g, "_").trim() || fallback
  const withExtension = /\.csv$/i.test(sanitized) ? sanitized : `${sanitized}.csv`
  if (!maskAccountIdentifiers) {
    return withExtension
  }

  return withExtension.replace(/\.csv$/i, "-masked.csv")
}

function createFields(subscription: Subscription, maskAccountIdentifiers: boolean): string[] {
  return [
    subscription.providerName,
    subscription.serviceName,
    maskIfRequested(subscription.accountName, maskAccountIdentifiers),
    formatInvariantDecimal(subscription.billingAmount.amount),
    subscription.billingAmount.currencyCode,
    formatBillingInterval(subscription.intervalUnit, subscription.intervalCount),
    subscription.startsOn ?? "",
    subscription.nextBillingOn ?? "",
    "",
    subscription.isActive ? "TRUE" : "FALSE",
    PAYMENT_CHANNEL_CODES[subscription.paymentChannel],
    subscription.paymentAccount === null
      ? MISSING_PAYMENT_ACCOUNT
      : maskIfRequested(subscription.paymentAccount, maskAccountIdentifiers),
    subscription.notes ?? "",
  ]
}

function maskIfRequested(value: string | null, maskAccountIdentifiers: boolean): string {
  if (value === null || value === "") {
    return ""
  }

  return maskAccountIdentifiers ? ACCOUNT_MASK : value
}

function formatBillingInterval(unit: BillingIntervalUnit, count: number): string {
  if (unit === "day" && count === 1) {
    return "D"
  }

  if (unit === "week" && count === 1) {
    return "W"
  }

  if (unit === "month" && count === 1) {
    return "M"
  }

  if (unit === "month" && count === 3) {
    return "Q"
  }

  if (unit === "month" && count === 6) {
    return "HY"
  }

  if (unit === "year" && count === 1) {
    return "Y"
  }

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("The billing interval is invalid.")
  }

  switch (unit) {
    case "day":
      return `${count}D`
    case "week":
      return `${count}W`
    case "month":
      return `${count}M`
    case "year":
      return `${count}Y`
  }
}

function formatInvariantDecimal(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error("The billing amount is not a finite number.")
  }

  if (amount === 0) {
    return "0"
  }

  return amount.toFixed(12).replace(/\.?0+$/, "")
}

function escapeField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\r") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
