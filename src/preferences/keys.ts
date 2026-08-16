export const LOCALE_STORAGE_KEY = "neko-subscription.locale"
export const THEME_STORAGE_KEY = "neko-subscription.theme"

export const APP_LOCALES = ["en", "zh-Hans", "zh-Hant", "ja"] as const
export const LOCALE_PREFERENCES = ["auto", ...APP_LOCALES] as const
export const THEME_PREFERENCES = ["auto", "light", "dark"] as const

export type AppLocale = (typeof APP_LOCALES)[number]
export type LocalePreference = (typeof LOCALE_PREFERENCES)[number]
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = "light" | "dark"

export function isLocalePreference(value: string | null): value is LocalePreference {
  return value !== null && (LOCALE_PREFERENCES as readonly string[]).includes(value)
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && (THEME_PREFERENCES as readonly string[]).includes(value)
}

export function resolveLocale(preference: LocalePreference, languages: readonly string[]): AppLocale {
  if (preference !== "auto") {
    return preference
  }

  for (const language of languages) {
    const resolved = mapBrowserLanguage(language)
    if (resolved !== null) {
      return resolved
    }
  }

  return "en"
}

export function mapBrowserLanguage(language: string): AppLocale | null {
  const normalized = language.trim().toLowerCase().replaceAll("_", "-")
  if (normalized === "") {
    return null
  }

  if (normalized === "ja" || normalized.startsWith("ja-")) {
    return "ja"
  }

  if (normalized === "zh-hant" || normalized.endsWith("-tw") || normalized.endsWith("-hk") || normalized.endsWith("-mo")) {
    return "zh-Hant"
  }

  if (normalized === "zh" || normalized.startsWith("zh-")) {
    return "zh-Hans"
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en"
  }

  return null
}

export function htmlLang(locale: AppLocale): string {
  switch (locale) {
    case "zh-Hans":
      return "zh-Hans"
    case "zh-Hant":
      return "zh-Hant"
    case "ja":
      return "ja"
    default:
      return "en"
  }
}

export function bcp47(locale: AppLocale): string {
  switch (locale) {
    case "zh-Hans":
      return "zh-CN"
    case "zh-Hant":
      return "zh-TW"
    case "ja":
      return "ja"
    default:
      return "en-US"
  }
}

export function readStoredLocale(): LocalePreference {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocalePreference(value) ? value : "auto"
  } catch {
    return "auto"
  }
}

export function readStoredTheme(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : "auto"
  } catch {
    return "auto"
  }
}

export function writeStoredLocale(value: LocalePreference): void {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, value)
}

export function writeStoredTheme(value: ThemePreference): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, value)
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "dark") {
    return "dark"
  }

  if (preference === "light") {
    return "light"
  }

  return prefersDark ? "dark" : "light"
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function browserLanguages(): string[] {
  if (typeof navigator === "undefined") {
    return []
  }

  if (navigator.languages && navigator.languages.length > 0) {
    return [...navigator.languages]
  }

  return navigator.language ? [navigator.language] : []
}
