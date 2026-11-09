import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '@/api/client'
import type { Reaction } from '@/api/types'

/** The reaction set lives in the backend (design.md §4.3); fetched once per page load. */
export const useReactionsStore = defineStore('reactions', () => {
  const all = ref<Reaction[]>([])
  const byKey = computed(() => new Map(all.value.map((r) => [r.key, r])))
  let loading: Promise<void> | null = null

  function load() {
    loading ??= api<Reaction[]>('/reactions').then((reactions) => {
      // Drop the "draw as colour emoji" selector (U+FE0F) so every reaction can use the
      // monochrome emoji font, e.g. 🕰️.
      all.value = reactions.map((r) => ({ ...r, emoji: r.emoji.replace(/️/g, '') }))
    })
    return loading
  }

  return { all, byKey, load }
})
