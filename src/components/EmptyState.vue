<script setup lang="ts">
import { FileUp } from "@lucide/vue"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <Empty class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileUp />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription>{{ description }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
