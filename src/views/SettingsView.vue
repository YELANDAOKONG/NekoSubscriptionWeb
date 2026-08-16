<script setup lang="ts">
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{{ preferences.t("Settings_LanguageTitle") }}</CardTitle>
          <CardDescription>{{ preferences.t("Settings_LanguageDescription") }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <Label for="language-select">{{ preferences.t("Settings_LanguageTitle") }}</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ preferences.t("Settings_ColorThemeTitle") }}</CardTitle>
          <CardDescription>{{ preferences.t("Settings_ColorThemeDescription") }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <Label for="theme-select">{{ preferences.t("Settings_ColorThemeTitle") }}</Label>
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
        </CardContent>
      </Card>

      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>{{ preferences.t("Settings_SessionTitle") }}</CardTitle>
          <CardDescription>{{ preferences.t("Settings_SessionDescription") }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground text-sm">
            {{ preferences.t("Settings_PreferencesHint") }}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
