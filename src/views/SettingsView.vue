<script setup lang="ts">
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LOCALE_PREFERENCES,
  THEME_PREFERENCES,
  type LocalePreference,
  type ThemePreference,
} from "@/preferences/keys"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()

const localeLabels: Record<LocalePreference, "Language_Automatic" | "Language_English" | "Language_SimplifiedChinese" | "Language_TraditionalChinese" | "Language_Japanese"> = {
  auto: "Language_Automatic",
  en: "Language_English",
  "zh-Hans": "Language_SimplifiedChinese",
  "zh-Hant": "Language_TraditionalChinese",
  ja: "Language_Japanese",
}

const themeLabels: Record<ThemePreference, "Theme_System" | "Theme_Light" | "Theme_Dark"> = {
  auto: "Theme_System",
  light: "Theme_Light",
  dark: "Theme_Dark",
}

function onLocaleChange(value: unknown): void {
  if (typeof value === "string") {
    preferences.setLocalePreference(value as LocalePreference)
  }
}

function onThemeChange(value: unknown): void {
  if (typeof value === "string") {
    preferences.setThemePreference(value as ThemePreference)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_Settings") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_SettingsSubtitle") }}
      </p>
    </div>

    <FieldGroup class="max-w-xl">
      <Field>
        <FieldLabel for="language-select">{{ preferences.t("Settings_LanguageTitle") }}</FieldLabel>
        <FieldDescription>{{ preferences.t("Settings_LanguageDescription") }}</FieldDescription>
        <Select :model-value="preferences.localePreference" @update:model-value="onLocaleChange">
          <SelectTrigger id="language-select" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in LOCALE_PREFERENCES" :key="option" :value="option">
              {{ preferences.t(localeLabels[option]) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel for="theme-select">{{ preferences.t("Settings_ColorThemeTitle") }}</FieldLabel>
        <FieldDescription>{{ preferences.t("Settings_ColorThemeDescription") }}</FieldDescription>
        <Select :model-value="preferences.themePreference" @update:model-value="onThemeChange">
          <SelectTrigger id="theme-select" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in THEME_PREFERENCES" :key="option" :value="option">
              {{ preferences.t(themeLabels[option]) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <p class="text-muted-foreground border-t pt-6 text-sm leading-relaxed">
        {{ preferences.t("Settings_SessionDescription") }}
      </p>
    </FieldGroup>
  </div>
</template>
