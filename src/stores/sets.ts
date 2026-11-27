import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api, errorText } from '@/api/client'
import type { SetSummary } from '@/api/types'

/**
 * Every set with the user's progress, kept between visits so going back to Sets (or
 * stepping between sets) shows the last list at once while a fresh one loads behind it.
 */
export const useSetsStore = defineStore('sets', () => {
  const sets = ref<SetSummary[] | null>(null)
  // What each shelf page shows, kept while browsing: the decade picked in a long section of
  // years ("group/section" -> decade) and the group tab open on a shelf (kind -> group key).
  const decades = ref<Record<string, number>>({})
  const tabs = ref<Record<string, string>>({})

  // Why the first load failed, if it did (a background refresh failing keeps the old list).
  const error = ref('')

  async function refresh() {
    sets.value = await api<SetSummary[]>('/sets')
    error.value = ''
  }

  /** Waits only when there's nothing to show yet; otherwise refreshes in the background. */
  async function load() {
    if (sets.value !== null) return void refresh().catch(() => {})
    try {
      await refresh()
    } catch (e) {
      error.value = errorText(e)
    }
  }

  return { sets, error, decades, tabs, refresh, load }
})
