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
  // What each shelf page shows, kept while browsing: the decade picked in a long section of
  // years ("group/section" -> decade) and the group tab open on a shelf (kind -> group key).
  const decades = ref<Record<string, number>>({})
  const tabs = ref<Record<string, string>>({})

  async function refresh() {
    sets.value = await api<SetSummary[]>('/sets')
  }

  /** Waits only when there's nothing to show yet; otherwise refreshes in the background. */
  async function load() {
    if (sets.value === null) await refresh()
    else void refresh().catch(() => {})
  }

  return { sets, decades, tabs, refresh, load }
})
