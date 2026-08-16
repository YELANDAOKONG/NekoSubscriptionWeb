<script setup lang="ts">
import { ExternalLink } from "@lucide/vue"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ preferences.t("Nav_About") }}</h1>
      <p class="text-muted-foreground text-sm md:text-base">
        {{ preferences.t("Page_AboutSubtitle") }}
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ preferences.t("About_IntroTitle") }}</CardTitle>
        <CardDescription>{{ preferences.t("About_IntroCompanion") }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
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
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ preferences.t("About_CsvTitle") }}</CardTitle>
        <CardDescription>{{ preferences.t("About_CsvDescription") }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="rounded-md border">
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
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ preferences.t("About_RuleTitle") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol class="flex flex-col gap-3">
          <li v-for="(rule, index) in rules" :key="rule" class="flex gap-3 text-sm leading-relaxed">
            <span class="text-muted-foreground w-5 shrink-0 font-medium">{{ index + 1 }}.</span>
            <span>{{ preferences.t(rule) }}</span>
          </li>
        </ol>
      </CardContent>
    </Card>
  </div>
</template>
