import { ref } from "vue"

const importOpen = ref(false)
const queuedFile = ref<File | null>(null)

export function useCsvImport() {
  function openImport(file?: File): void {
    if (file) {
      queuedFile.value = file
    }
    importOpen.value = true
  }

  function takeQueuedFile(): File | null {
    const file = queuedFile.value
    queuedFile.value = null
    return file
  }

  return {
    importOpen,
    queuedFile,
    openImport,
    takeQueuedFile,
  }
}
