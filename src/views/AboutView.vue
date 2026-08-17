<script setup lang="ts">
import { ExternalLink } from "@lucide/vue"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CSV_FORMAT_COLUMNS, PROJECT_REPOSITORY_URL } from "@/csv/format"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()

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

    <section class="flex flex-col gap-4">
      <div class="flex max-w-prose flex-col gap-2">
        <h2 class="text-lg font-semibold">{{ preferences.t("About_CsvTitle") }}</h2>
        <p class="text-muted-foreground text-sm">
          {{ preferences.t("About_CsvDescription") }}
        </p>
      </div>
      <div class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">{{ preferences.t("About_CsvIndex") }}</TableHead>
              <TableHead class="whitespace-nowrap">{{ preferences.t("About_CsvHeader") }}</TableHead>
              <TableHead>{{ preferences.t("About_CsvMeaning") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="column in CSV_FORMAT_COLUMNS" :key="column.index">
              <TableCell class="text-muted-foreground font-mono">{{ column.index }}</TableCell>
              <TableCell class="font-mono text-xs sm:text-sm">{{ column.header }}</TableCell>
              <TableCell class="text-sm">{{ preferences.t(column.description) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
