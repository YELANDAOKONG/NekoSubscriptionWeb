import { addDays, addMonths, addYears, todayIso } from "@/domain/dates"
import type { Subscription } from "@/domain/types"

export const SAMPLE_CSV_FILE_NAME = "NekoSubscription-sample.csv"

export function createSampleSubscriptions(): Subscription[] {
  const today = todayIso()
  const lastYear = addYears(today, -1)

  return [
    sampleRow({
      id: "sample-netflix",
      providerName: "Netflix",
      serviceName: "Standard",
      accountName: "household@example.com",
      amount: 15.49,
      currencyCode: "USD",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addDays(today, 5),
      isActive: true,
      paymentChannel: "credit_card",
      paymentAccount: "Visa 1002",
      notes: "4K household, four screens",
    }),
    sampleRow({
      id: "sample-icloud",
      providerName: "Apple",
      serviceName: "iCloud+ 200 GB",
      accountName: "icloud@example.com",
      amount: 2.99,
      currencyCode: "USD",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addDays(today, 12),
      isActive: true,
      paymentChannel: "apple",
      paymentAccount: "icloud@example.com",
      notes: "Family sharing",
    }),
    sampleRow({
      id: "sample-github",
      providerName: "GitHub",
      serviceName: "Team",
      accountName: "org@example.com",
      amount: 4,
      currencyCode: "USD",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addDays(today, 21),
      isActive: true,
      paymentChannel: "credit_card",
      paymentAccount: null,
      notes: null,
    }),
    sampleRow({
      id: "sample-youtube",
      providerName: "Google",
      serviceName: "YouTube Premium",
      accountName: "yt@example.com",
      amount: 13.99,
      currencyCode: "USD",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addMonths(today, 1),
      isActive: true,
      paymentChannel: "google",
      paymentAccount: "yt@example.com",
      notes: null,
    }),
    sampleRow({
      id: "sample-domain",
      providerName: "Cloudflare",
      serviceName: "example.org",
      accountName: null,
      amount: 10.44,
      currencyCode: "USD",
      intervalUnit: "year",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addMonths(today, 4),
      isActive: true,
      paymentChannel: "bank",
      paymentAccount: null,
      notes: "Domain registration",
    }),
    sampleRow({
      id: "sample-bilibili",
      providerName: "Bilibili",
      serviceName: "Premium",
      accountName: null,
      amount: 15,
      currencyCode: "CNY",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addDays(today, 8),
      isActive: true,
      paymentChannel: "direct",
      paymentAccount: null,
      notes: null,
    }),
    sampleRow({
      id: "sample-adobe",
      providerName: "Adobe",
      serviceName: "Creative Cloud",
      accountName: "design@example.com",
      amount: 54.99,
      currencyCode: "USD",
      intervalUnit: "month",
      intervalCount: 1,
      startsOn: lastYear,
      nextBillingOn: addDays(today, 18),
      isActive: false,
      paymentChannel: "credit_card",
      paymentAccount: "Visa 1002",
      notes: "Paused for now",
    }),
  ]
}

function sampleRow(input: {
  id: string
  providerName: string
  serviceName: string
  accountName: string | null
  amount: number
  currencyCode: string
  intervalUnit: Subscription["intervalUnit"]
  intervalCount: number
  startsOn: string
  nextBillingOn: string
  isActive: boolean
  paymentChannel: Subscription["paymentChannel"]
  paymentAccount: string | null
  notes: string | null
}): Subscription {
  return {
    id: input.id,
    providerName: input.providerName,
    serviceName: input.serviceName,
    accountName: input.accountName,
    billingAmount: {
      amount: input.amount,
      currencyCode: input.currencyCode,
      currencyKind: "iso4217",
    },
    intervalUnit: input.intervalUnit,
    intervalCount: input.intervalCount,
    startsOn: input.startsOn,
    nextBillingOn: input.nextBillingOn,
    isActive: input.isActive,
    participatesInBudget: input.isActive,
    paymentChannel: input.paymentChannel,
    paymentAccount: input.paymentAccount,
    notes: input.notes,
  }
}
