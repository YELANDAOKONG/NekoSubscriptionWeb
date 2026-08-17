export type BillingIntervalUnit = "day" | "week" | "month" | "year"

export type PaymentChannel =
  | "direct"
  | "apple"
  | "google"
  | "paypal"
  | "bank"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "other"

export type CurrencyKind = "iso4217" | "custom"

export type Money = {
  amount: number
  currencyCode: string
  currencyKind: CurrencyKind
}

export type Subscription = {
  id: string
  providerName: string
  serviceName: string
  accountName: string | null
  billingAmount: Money
  intervalUnit: BillingIntervalUnit
  intervalCount: number
  startsOn: string | null
  nextBillingOn: string | null
  isActive: boolean
  participatesInBudget: boolean
  paymentChannel: PaymentChannel
  paymentAccount: string | null
  notes: string | null
}

export type CsvImportIssueSeverity = "error" | "warning"

export type CsvImportIssueCode =
  | "malformed_csv"
  | "invalid_column_count"
  | "missing_provider"
  | "invalid_amount_or_currency"
  | "invalid_billing_period"
  | "invalid_date"
  | "invalid_date_order"
  | "invalid_subscription_marker"
  | "invalid_payment_channel"
  | "missing_payment_account"
  | "duplicate_row"

export type CsvImportIssue = {
  rowNumber: number
  severity: CsvImportIssueSeverity
  code: CsvImportIssueCode
}

export type ImportedSubscriptionRow = {
  providerName: string
  serviceName: string
  accountName: string | null
  billingAmount: Money
  intervalUnit: BillingIntervalUnit
  intervalCount: number
  startsOn: string | null
  nextBillingOn: string | null
  isActive: boolean
  paymentChannel: PaymentChannel
  paymentAccount: string | null
  notes: string | null
}

export type CsvImportPreview = {
  totalRowCount: number
  validRowCount: number
  errorCount: number
  warningCount: number
  canImport: boolean
  issues: CsvImportIssue[]
}

export type CsvParseResult = {
  rows: ImportedSubscriptionRow[]
  preview: CsvImportPreview
}

export type CashFlowItem = {
  subscriptionId: string
  providerName: string
  serviceName: string
  accountName: string | null
  scheduledOn: string
  amount: Money
  isEstimate: boolean
}

export type CashFlowCurrencyTotal = {
  currencyCode: string
  currencyKind: CurrencyKind
  fixedAmount: number
  estimatedAmount: number
  totalAmount: number
}

export type CurrencyAmountTotal = {
  currencyCode: string
  currencyKind: CurrencyKind
  totalAmount: number
}

export type CashFlowProjection = {
  startsOn: string
  endsOn: string
  items: CashFlowItem[]
  currencyTotals: CashFlowCurrencyTotal[]
}

export type OverduePayment = {
  subscription: Subscription
  dueOn: string
  daysOverdue: number
}

export const CSV_COLUMN_COUNT = 13
export const CSV_MAXIMUM_FILE_SIZE = 10 * 1024 * 1024
export const FORECAST_PERIODS = [3, 7, 14, 30, 90] as const
export const DEFAULT_FORECAST_DAYS = 7
export const CALENDAR_DAY_COUNT = 42
export const MISSING_CURRENCY_CODE = "XXX"
export const MAXIMUM_CURRENCY_CODE_LENGTH = 10
