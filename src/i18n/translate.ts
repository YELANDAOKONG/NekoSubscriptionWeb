import { en, type MessageKey } from "@/i18n/locales/en"
import { ja } from "@/i18n/locales/ja"
import { zhHans } from "@/i18n/locales/zh-Hans"
import { zhHant } from "@/i18n/locales/zh-Hant"
import type { AppLocale } from "@/preferences/keys"

const catalogs: Record<AppLocale, Record<MessageKey, string>> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja,
}

export function translate(locale: AppLocale, key: MessageKey, args: readonly unknown[] = []): string {
  const template = catalogs[locale][key] ?? en[key]
  if (template === undefined) {
    throw new Error(`The UI resource '${key}' is missing.`)
  }

  return formatTemplate(template, args)
}

export function formatTemplate(template: string, args: readonly unknown[]): string {
  return template.replaceAll(/\{(\d+)\}/g, (matched, index) => {
    const value = args[Number(index)]
    return value === undefined ? matched : String(value)
  })
}
