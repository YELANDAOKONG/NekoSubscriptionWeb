const MS_PER_DAY = 24 * 60 * 60 * 1000
const MONTHS_PER_YEAR = 12
const DAYS_PER_WEEK = 7
const TWO_DIGIT_YEAR_PIVOT = 2029

export type DateParts = {
  year: number
  month: number
  day: number
}

export function todayIso(): string {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function parseIsoDate(value: string): DateParts {
  const [yearText, monthText, dayText] = value.split("-")
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  }
}

export function startOfMonth(iso: string): string {
  const { year, month } = parseIsoDate(iso)
  return toIsoDate(year, month, 1)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false
  }

  return day <= daysInMonth(year, month)
}

export function addDays(iso: string, days: number): string {
  const utc = toUtcDate(iso)
  utc.setUTCDate(utc.getUTCDate() + days)
  return fromUtcDate(utc)
}

export function addMonths(iso: string, months: number): string {
  const { year, month, day } = parseIsoDate(iso)
  const zeroBased = year * MONTHS_PER_YEAR + (month - 1) + months
  const newYear = Math.floor(zeroBased / MONTHS_PER_YEAR)
  const newMonth = ((zeroBased % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR + 1
  const clampedDay = Math.min(day, daysInMonth(newYear, newMonth))
  return toIsoDate(newYear, newMonth, clampedDay)
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * MONTHS_PER_YEAR)
}

export function compareIso(left: string, right: string): number {
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

export function dayNumber(iso: string): number {
  return Math.round(toUtcDate(iso).getTime() / MS_PER_DAY)
}

export function weekdayMondayFirst(iso: string): number {
  return (toUtcDate(iso).getUTCDay() + 6) % 7
}

export function monthDifference(earlierIso: string, laterIso: string): number {
  const earlier = parseIsoDate(earlierIso)
  const later = parseIsoDate(laterIso)
  return (later.year - earlier.year) * MONTHS_PER_YEAR + later.month - earlier.month
}

export function divideRoundingUp(dividend: number, divisor: number): number {
  return Math.floor((dividend + divisor - 1) / divisor)
}

export function daysPerWeek(): number {
  return DAYS_PER_WEEK
}

export function expandTwoDigitYear(year: number): number {
  const century = Math.floor(TWO_DIGIT_YEAR_PIVOT / 100) * 100
  const expanded = century + year
  return expanded > TWO_DIGIT_YEAR_PIVOT ? expanded - 100 : expanded
}

export function parseSupportedDate(value: string): string | null {
  const monthFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value)
  if (monthFirst) {
    const month = Number(monthFirst[1])
    const day = Number(monthFirst[2])
    const rawYear = Number(monthFirst[3])
    const year = monthFirst[3].length === 2 ? expandTwoDigitYear(rawYear) : rawYear
    return isValidYmd(year, month, day) ? toIsoDate(year, month, day) : null
  }

  const yearFirstDash = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  if (yearFirstDash) {
    const year = Number(yearFirstDash[1])
    const month = Number(yearFirstDash[2])
    const day = Number(yearFirstDash[3])
    return isValidYmd(year, month, day) ? toIsoDate(year, month, day) : null
  }

  const yearFirstSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value)
  if (yearFirstSlash) {
    const year = Number(yearFirstSlash[1])
    const month = Number(yearFirstSlash[2])
    const day = Number(yearFirstSlash[3])
    return isValidYmd(year, month, day) ? toIsoDate(year, month, day) : null
  }

  return null
}

function toUtcDate(iso: string): Date {
  const { year, month, day } = parseIsoDate(iso)
  return new Date(Date.UTC(year, month - 1, day))
}

function fromUtcDate(date: Date): string {
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}
