import {
  addDays,
  addMonths,
  addYears,
  compareIso,
  dayNumber,
  daysPerWeek,
  divideRoundingUp,
  monthDifference,
} from "@/domain/dates"
import type {
  BillingIntervalUnit,
  CashFlowCurrencyTotal,
  CashFlowItem,
  CashFlowProjection,
  Subscription,
} from "@/domain/types"

export function projectCashFlow(
  subscriptions: Subscription[],
  startsOn: string,
  endsOn: string,
): CashFlowProjection {
  if (compareIso(endsOn, startsOn) < 0) {
    throw new Error("The projection end date cannot be earlier than the start date.")
  }

  const items = subscriptions
    .filter((subscription) => subscription.participatesInBudget)
    .flatMap((subscription) => createItems(subscription, startsOn, endsOn))
    .sort(compareCashFlowItem)

  const totals = new Map<string, CashFlowCurrencyTotal>()
  for (const item of items) {
    const key = `${item.amount.currencyCode}\u001F${item.amount.currencyKind}`
    const current = totals.get(key) ?? {
      currencyCode: item.amount.currencyCode,
      currencyKind: item.amount.currencyKind,
      fixedAmount: 0,
      estimatedAmount: 0,
      totalAmount: 0,
    }
    if (item.isEstimate) {
      current.estimatedAmount += item.amount.amount
    } else {
      current.fixedAmount += item.amount.amount
    }
    current.totalAmount = current.fixedAmount + current.estimatedAmount
    totals.set(key, current)
  }

  const currencyTotals = [...totals.values()].sort((left, right) => {
    const currencyOrder = left.currencyCode.localeCompare(right.currencyCode)
    if (currencyOrder !== 0) {
      return currencyOrder
    }

    return left.currencyKind.localeCompare(right.currencyKind)
  })

  return { startsOn, endsOn, items, currencyTotals }
}

function createItems(
  subscription: Subscription,
  startsOn: string,
  endsOn: string,
): CashFlowItem[] {
  return getScheduledDates(subscription, startsOn, endsOn).map((scheduledOn) => ({
    subscriptionId: subscription.id,
    providerName: subscription.providerName,
    serviceName: subscription.serviceName,
    accountName: subscription.accountName,
    scheduledOn,
    amount: subscription.billingAmount,
    isEstimate: false,
  }))
}

function getScheduledDates(
  subscription: Subscription,
  startsOn: string,
  endsOn: string,
): string[] {
  const anchorDate = subscription.nextBillingOn ?? subscription.startsOn
  if (anchorDate === null) {
    return []
  }

  const dates: string[] = []
  let occurrenceIndex = getInitialOccurrenceIndex(
    anchorDate,
    startsOn,
    subscription.intervalUnit,
    subscription.intervalCount,
  )

  while (true) {
    const occurrenceDate = getOccurrenceDate(
      anchorDate,
      subscription.intervalUnit,
      subscription.intervalCount,
      occurrenceIndex,
    )
    if (occurrenceDate === null || compareIso(occurrenceDate, endsOn) > 0) {
      break
    }

    if (compareIso(occurrenceDate, startsOn) >= 0) {
      dates.push(occurrenceDate)
    }

    occurrenceIndex++
  }

  return dates
}

function getInitialOccurrenceIndex(
  anchorDate: string,
  startsOn: string,
  intervalUnit: BillingIntervalUnit,
  intervalCount: number,
): number {
  if (compareIso(startsOn, anchorDate) <= 0) {
    return 0
  }

  switch (intervalUnit) {
    case "day":
      return divideRoundingUp(dayNumber(startsOn) - dayNumber(anchorDate), intervalCount)
    case "week":
      return divideRoundingUp(
        dayNumber(startsOn) - dayNumber(anchorDate),
        intervalCount * daysPerWeek(),
      )
    case "month":
      return Math.floor(monthDifference(anchorDate, startsOn) / intervalCount)
    case "year": {
      const startYear = Number(startsOn.slice(0, 4))
      const anchorYear = Number(anchorDate.slice(0, 4))
      return Math.floor((startYear - anchorYear) / intervalCount)
    }
  }
}

function getOccurrenceDate(
  anchorDate: string,
  intervalUnit: BillingIntervalUnit,
  intervalCount: number,
  occurrenceIndex: number,
): string | null {
  const unitsToAdd = intervalCount * occurrenceIndex
  if (!Number.isSafeInteger(unitsToAdd) || unitsToAdd > Number.MAX_SAFE_INTEGER) {
    return null
  }

  switch (intervalUnit) {
    case "day":
      return addDays(anchorDate, unitsToAdd)
    case "week":
      return addDays(anchorDate, unitsToAdd * daysPerWeek())
    case "month":
      return addMonths(anchorDate, unitsToAdd)
    case "year":
      return addYears(anchorDate, unitsToAdd)
  }
}

function compareCashFlowItem(left: CashFlowItem, right: CashFlowItem): number {
  const dateOrder = compareIso(left.scheduledOn, right.scheduledOn)
  if (dateOrder !== 0) {
    return dateOrder
  }

  const currencyOrder = left.amount.currencyCode.localeCompare(right.amount.currencyCode)
  if (currencyOrder !== 0) {
    return currencyOrder
  }

  const providerOrder = left.providerName.localeCompare(right.providerName)
  if (providerOrder !== 0) {
    return providerOrder
  }

  const serviceOrder = left.serviceName.localeCompare(right.serviceName)
  if (serviceOrder !== 0) {
    return serviceOrder
  }

  const accountOrder = (left.accountName ?? "").localeCompare(right.accountName ?? "")
  if (accountOrder !== 0) {
    return accountOrder
  }

  return left.subscriptionId.localeCompare(right.subscriptionId)
}
