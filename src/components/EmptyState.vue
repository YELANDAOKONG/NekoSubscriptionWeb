<script setup lang="ts">
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
      <EmptyMedia v-if="$slots.icon" variant="icon">
        <slot name="icon" />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription>{{ description }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
