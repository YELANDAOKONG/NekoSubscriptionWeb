import { useMediaQuery } from "@vueuse/core"
import { computed, type WritableComputedRef } from "vue"
import { useRoute, useRouter } from "vue-router"

import { compactQuery, parseListLayout, type ListLayout } from "@/navigation"

export function useListLayout(): { layout: WritableComputedRef<ListLayout> } {
  const isWide = useMediaQuery("(min-width: 768px)")
  const route = useRoute()
  const router = useRouter()

  const layout = computed({
    get: (): ListLayout => parseListLayout(route.query.layout) ?? (isWide.value ? "table" : "cards"),
    set: (value: ListLayout) => {
      void router.replace({
        query: compactQuery(route.query, { layout: value }),
      })
    },
  })

  return { layout }
}
