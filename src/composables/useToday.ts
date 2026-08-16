import { ref } from "vue"

import { todayIso } from "@/domain/dates"

// Shared app-lifetime "today" that refreshes when the tab becomes active again,
// so overdue and calendar highlighting do not go stale across midnight.
const today = ref(todayIso())
let listening = false

function refresh(): void {
  today.value = todayIso()
}

export function useToday() {
  if (!listening) {
    listening = true
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refresh()
      }
    })
  }

  return today
}
