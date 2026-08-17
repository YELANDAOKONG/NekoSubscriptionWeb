import { useMediaQuery } from "@vueuse/core"
import { computed, ref, type WritableComputedRef } from "vue"

import type { ListLayout } from "@/components/LayoutToggle.vue"

export function useListLayout(): { layout: WritableComputedRef<ListLayout> } {
  const isWide = useMediaQuery("(min-width: 768px)")
  const override = ref<ListLayout | null>(null)

  const layout = computed({
    get: (): ListLayout => override.value ?? (isWide.value ? "table" : "cards"),
    set: (value: ListLayout) => {
      override.value = value
    },
  })

  return { layout }
}
