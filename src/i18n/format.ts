import { enUS, ja, zhCN, zhTW } from "date-fns/locale"
import { format, parseISO } from "date-fns"

import type { MessageKey } from "@/i18n/locales/en"
import { translate } from "@/i18n/translate"
import { bcp47, type AppLocale } from "@/preferences/keys"
import type {
  BillingIntervalUnit,
  CsvImportIssueCode,
  Money,
  PaymentChannel,
} from "@/domain/types"

const ISSUE_KEYS: Record<CsvImportIssueCode, MessageKey> = {
  malformed_csv: "ImportIssue_MalformedCsv",
  invalid_column_count: "ImportIssue_InvalidColumnCount",
  missing_provider: "ImportIssue_MissingProvider",
  invalid_amount_or_currency: "ImportIssue_InvalidAmountOrCurrency",
  invalid_billing_period: "ImportIssue_InvalidBillingPeriod",
  invalid_date: "ImportIssue_InvalidDate",
  invalid_date_order: "ImportIssue_InvalidDateOrder",
  invalid_subscription_marker: "ImportIssue_InvalidSubscriptionMarker",
  invalid_payment_channel: "ImportIssue_InvalidPaymentChannel",
  missing_payment_account: "ImportIssue_MissingPaymentAccount",
  duplicate_row: "ImportIssue_DuplicateRow",
}

const CHANNEL_KEYS: Record<PaymentChannel, MessageKey> = {
  direct: "PaymentChannel_Direct",
  apple: "PaymentChannel_Apple",
  google: "PaymentChannel_Google",
  paypal: "PaymentChannel_PayPal",
  bank: "PaymentChannel_Bank",
  credit_card: "PaymentChannel_CreditCard",
  debit_card: "PaymentChannel_DebitCard",
  cash: "PaymentChannel_Cash",
  other: "PaymentChannel_Other",
}

export function dateFnsLocale(locale: AppLocale) {
  switch (locale) {
    case "zh-Hans":
      return zhCN
    case "zh-Hant":
      return zhTW
    case "ja":
      return ja
    default:
      return enUS
  }
}

export function formatIsoDate(iso: string, locale: AppLocale, pattern = "PP"): string {
  return format(parseISO(iso), pattern, { locale: dateFnsLocale(locale) })
}

export function formatMonthTitle(iso: string, locale: AppLocale): string {
  return format(parseISO(iso), "MMMM yyyy", { locale: dateFnsLocale(locale) })
}

const numberFormatCache = new Map<string, Intl.NumberFormat>()

function numberFormat(
  locale: AppLocale,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): Intl.NumberFormat {
  const key = `${bcp47(locale)}|${minimumFractionDigits}|${maximumFractionDigits}`
  const cached = numberFormatCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const created = new Intl.NumberFormat(bcp47(locale), {
    minimumFractionDigits,
    maximumFractionDigits,
  })
  numberFormatCache.set(key, created)
  return created
}

export function formatMoney(money: Money, locale: AppLocale): string {
  const isStandardCurrency = money.currencyKind === "iso4217"
  const formattedAmount = numberFormat(
    locale,
    isStandardCurrency ? 2 : 0,
    isStandardCurrency ? 2 : 8,
  ).format(money.amount)
  return `${formattedAmount} ${money.currencyCode}`
}

export function issueMessage(locale: AppLocale, code: CsvImportIssueCode): string {
  return translate(locale, ISSUE_KEYS[code])
}

export function paymentChannelLabel(locale: AppLocale, channel: PaymentChannel): string {
  return translate(locale, CHANNEL_KEYS[channel])
}

export function cycleLabel(
  locale: AppLocale,
  intervalUnit: BillingIntervalUnit,
  intervalCount: number,
): string {
  if (intervalUnit === "month" && intervalCount === 3) {
    return translate(locale, "Cycle_Quarter")
  }

  if (intervalUnit === "month" && intervalCount === 6) {
    return translate(locale, "Cycle_HalfYear")
  }

  if (intervalUnit === "day" && intervalCount === 1) {
    return translate(locale, "Cycle_Day")
  }

  if (intervalUnit === "week" && intervalCount === 1) {
    return translate(locale, "Cycle_Week")
  }

  if (intervalUnit === "month" && intervalCount === 1) {
    return translate(locale, "Cycle_Month")
  }

  if (intervalUnit === "year" && intervalCount === 1) {
    return translate(locale, "Cycle_Year")
  }

  return `${intervalCount} ${intervalUnit}`
}
