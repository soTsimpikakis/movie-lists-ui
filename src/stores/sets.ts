import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api/client'
import type { SetSummary } from '@/api/types'

/**
 * Every set with the user's progress, kept between visits so going back to Sets (or
 * stepping between sets) shows the last list at once while a fresh one loads behind it.
 */
export const useSetsStore = defineStore('sets', () => {
  const sets = ref<SetSummary[] | null>(null)
  // Which decade of Best Picture years the Sets page shows; null until the user picks one.
  const ceremonyDecade = ref<number | null>(null)

  async function refresh() {
    sets.value = await api<SetSummary[]>('/sets')
  }

  /** Waits only when there's nothing to show yet; otherwise refreshes in the background. */
  async function load() {
    if (sets.value === null) await refresh()
    else void refresh().catch(() => {})
  }

  return { sets, ceremonyDecade, refresh, load }
})
