import { ref } from 'vue'

import { errorText } from '@/api/client'

/**
 * Busy and error state for an async action: `run` clears the error, sets `busy` while the
 * work runs, and keeps the error's message if it throws. Resolves to whether it succeeded.
 */
export function useAsyncAction() {
  const busy = ref(false)
  const error = ref('')

  async function run(work: () => Promise<unknown>): Promise<boolean> {
    error.value = ''
    busy.value = true
    try {
      await work()
      return true
    } catch (e) {
      error.value = errorText(e)
      return false
    } finally {
      busy.value = false
    }
  }

  return { run, busy, error }
}
