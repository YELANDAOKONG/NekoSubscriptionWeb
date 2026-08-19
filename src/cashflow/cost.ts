import type {
  CurrencyAmountTotal,
  CurrencyKind,
  Money,
  OverduePayment,
  Subscription,
} from "@/domain/types"

const DAYS_PER_YEAR = 365
const WEEKS_PER_YEAR = 52
const MONTHS_PER_YEAR = 12

export function monthlyEquivalentAmount(subscription: Subscription): number {
  const { amount } = subscription.billingAmount
  const { intervalCount, intervalUnit } = subscription

  switch (intervalUnit) {
    case "day":
      return (amount * DAYS_PER_YEAR) / (MONTHS_PER_YEAR * intervalCount)
    case "week":
      return (amount * WEEKS_PER_YEAR) / (MONTHS_PER_YEAR * intervalCount)
    case "month":
      return amount / intervalCount
    case "year":
      return amount / (MONTHS_PER_YEAR * intervalCount)
  }
}

export function summarizeMonthlyCost(subscriptions: readonly Subscription[]): CurrencyAmountTotal[] {
  const totals = new Map<string, CurrencyAmountTotal>()
  for (const subscription of subscriptions) {
    if (!subscription.participatesInBudget) {
      continue
    }

    addAmount(
      totals,
      subscription.billingAmount.currencyCode,
      subscription.billingAmount.currencyKind,
      monthlyEquivalentAmount(subscription),
    )
  }

  return sortCurrencyTotals(totals)
}

export function summarizeOverdueFunds(payments: readonly OverduePayment[]): CurrencyAmountTotal[] {
  const totals = new Map<string, CurrencyAmountTotal>()
  for (const payment of payments) {
    addAmount(
      totals,
      payment.subscription.billingAmount.currencyCode,
      payment.subscription.billingAmount.currencyKind,
      payment.subscription.billingAmount.amount,
    )
  }

  return sortCurrencyTotals(totals)
}

export function summarizeItemAmounts(items: readonly { amount: Money }[]): CurrencyAmountTotal[] {
  const totals = new Map<string, CurrencyAmountTotal>()
  for (const item of items) {
    addAmount(totals, item.amount.currencyCode, item.amount.currencyKind, item.amount.amount)
  }

  return sortCurrencyTotals(totals)
}

function addAmount(
  totals: Map<string, CurrencyAmountTotal>,
  currencyCode: string,
  currencyKind: CurrencyKind,
  amount: number,
): void {
  const key = `${currencyCode}\u001F${currencyKind}`
  const current = totals.get(key) ?? {
    currencyCode,
    currencyKind,
    totalAmount: 0,
  }
  current.totalAmount += amount
  totals.set(key, current)
}

function sortCurrencyTotals(totals: Map<string, CurrencyAmountTotal>): CurrencyAmountTotal[] {
  return [...totals.values()].sort((left, right) => {
    const currencyOrder = left.currencyCode.localeCompare(right.currencyCode)
    if (currencyOrder !== 0) {
      return currencyOrder
    }

    return left.currencyKind.localeCompare(right.currencyKind)
  })
}
