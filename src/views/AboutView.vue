<script setup lang="ts">
import { ExternalLink } from "@lucide/vue"

import { Button } from "@/components/ui/button"
import { CSV_FORMAT_COLUMNS, PROJECT_REPOSITORY_URL } from "@/csv/format"
import type { MessageKey } from "@/i18n/locales/en"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()

const csvGroups: ReadonlyArray<{
  title: MessageKey
  columns: typeof CSV_FORMAT_COLUMNS
}> = [
  { title: "About_CsvGroupIdentity", columns: CSV_FORMAT_COLUMNS.slice(0, 3) },
  { title: "About_CsvGroupBilling", columns: CSV_FORMAT_COLUMNS.slice(3, 6) },
  { title: "About_CsvGroupDates", columns: CSV_FORMAT_COLUMNS.slice(6, 9) },
  { title: "About_CsvGroupPayment", columns: CSV_FORMAT_COLUMNS.slice(9) },
]

const rules = ["About_Rule1", "About_Rule2", "About_Rule3", "About_Rule4", "About_Rule5"] as const
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_About") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_AboutSubtitle") }}
      </p>
    </div>

    <section class="flex max-w-prose flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-semibold">{{ preferences.t("About_IntroTitle") }}</h2>
        <p class="text-muted-foreground text-sm">
          {{ preferences.t("About_IntroCompanion") }}
        </p>
      </div>
      <p class="text-sm leading-relaxed">
        {{ preferences.t("About_IntroBody") }}
      </p>
      <Button as-child class="w-full sm:w-fit">
        <a
          :href="PROJECT_REPOSITORY_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink />
          {{ preferences.t("About_OpenRepository") }}
        </a>
      </Button>
    </section>

    <section class="flex flex-col gap-6">
      <div class="flex max-w-prose flex-col gap-2">
        <h2 class="text-lg font-semibold">{{ preferences.t("About_CsvTitle") }}</h2>
        <p class="text-muted-foreground text-sm">
          {{ preferences.t("About_CsvDescription") }}
        </p>
      </div>

      <div
        v-for="group in csvGroups"
        :key="group.title"
        class="flex flex-col gap-3"
      >
        <h3 class="text-sm font-medium">{{ preferences.t(group.title) }}</h3>
        <ul class="divide-y">
          <li
            v-for="column in group.columns"
            :key="column.index"
            class="grid gap-1 py-3 sm:grid-cols-[2.5rem_minmax(10rem,14rem)_minmax(0,1fr)] sm:gap-4"
          >
            <span class="text-muted-foreground font-mono text-sm">{{ column.index }}</span>
            <span class="font-mono text-xs sm:text-sm">{{ column.header }}</span>
            <span class="text-sm leading-relaxed">{{ preferences.t(column.description) }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="flex max-w-prose flex-col gap-3">
      <h2 class="text-lg font-semibold">{{ preferences.t("About_RuleTitle") }}</h2>
      <ul class="flex flex-col gap-3">
        <li
          v-for="rule in rules"
          :key="rule"
          class="text-sm leading-relaxed"
        >
          {{ preferences.t(rule) }}
        </li>
      </ul>
    </section>
  </div>
</template>
