import { computed, ref, watch } from 'vue'

import { api } from '@/api/client'
import type { SearchResult } from '@/api/types'

/** Debounced TMDB search through the API; stale responses are dropped. */
export function useFilmSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const searching = ref(false)
  const error = ref('')
  const active = computed(() => query.value.trim().length >= 2)

  let debounce: ReturnType<typeof setTimeout> | undefined
  let inFlight: AbortController | undefined

  watch(query, (value) => {
    clearTimeout(debounce)
    inFlight?.abort()
    const q = value.trim()
    if (q.length < 2) {
      results.value = []
      searching.value = false
      return
    }
    searching.value = true
    debounce = setTimeout(async () => {
      const controller = (inFlight = new AbortController())
      try {
        results.value = await api<SearchResult[]>(`/films/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        error.value = ''
      } catch (e) {
        if (controller.signal.aborted) return
        error.value = e instanceof Error ? e.message : String(e)
      }
      searching.value = false
    }, 250)
  })

  return { query, results, searching, error, active }
}
