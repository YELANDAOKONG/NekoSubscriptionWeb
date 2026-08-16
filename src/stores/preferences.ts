import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"

import { translate } from "@/i18n/translate"
import type { MessageKey } from "@/i18n/locales/en"
import {
  applyResolvedTheme,
  browserLanguages,
  htmlLang,
  readStoredLocale,
  readStoredTheme,
  resolveLocale,
  resolveTheme,
  writeStoredLocale,
  writeStoredTheme,
  type LocalePreference,
  type ThemePreference,
} from "@/preferences/keys"

export const usePreferencesStore = defineStore("preferences", () => {
  const localePreference = ref<LocalePreference>(readStoredLocale())
  const themePreference = ref<ThemePreference>(readStoredTheme())
  const prefersDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches)

  const resolvedLocale = computed(() =>
    resolveLocale(localePreference.value, browserLanguages()),
  )
  const resolvedTheme = computed(() =>
    resolveTheme(themePreference.value, prefersDark.value),
  )

  watch(
    resolvedLocale,
    (locale) => {
      document.documentElement.lang = htmlLang(locale)
      document.title = translate(locale, "App_Name")
    },
    { immediate: true },
  )

  watch(
    resolvedTheme,
    (theme) => {
      applyResolvedTheme(theme)
    },
    { immediate: true },
  )

  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const onSchemeChange = (event: MediaQueryListEvent) => {
    prefersDark.value = event.matches
  }
  media.addEventListener("change", onSchemeChange)

  function t(key: MessageKey, ...args: unknown[]): string {
    return translate(resolvedLocale.value, key, args)
  }

  function setLocalePreference(value: LocalePreference): void {
    localePreference.value = value
    writeStoredLocale(value)
  }

  function setThemePreference(value: ThemePreference): void {
    themePreference.value = value
    writeStoredTheme(value)
  }

  return {
    localePreference,
    themePreference,
    resolvedLocale,
    resolvedTheme,
    t,
    setLocalePreference,
    setThemePreference,
  }
})
