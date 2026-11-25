import { computed, ref, type Ref, watch } from 'vue'

import { api } from '@/api/client'
import type { BrowsePage, SearchResult } from '@/api/types'
import { browseParams, type Filters, isFiltering } from '@/lib/filters'

// With library films hidden, a page can be mostly films already seen, so a load keeps
// fetching (a few pages at most) until it has something worth showing.
const TOP_UP_TO = 30
const TOP_UP_PAGES = 3

/**
 * Films matching person / years / genre filters, a page at a time ("Movies I've seen" and
 * the Find a film dialog). Reloads when the filters change; stale responses are dropped.
 */
export function useFilmBrowse(filters: Ref<Filters>) {
  const filtering = computed(() => isFiltering(filters.value))
  const browsed = ref<SearchResult[]>([])
  const page = ref<BrowsePage | null>(null)
  const browsing = ref(false)
  // The person's roles, kept while switching between them so the buttons don't flicker.
  const roles = ref<{ roles: string[]; role: string | null }>({ roles: [], role: null })
  let request = 0

  async function browse(from = 1) {
    const mine = ++request
    browsing.value = true
    try {
      const found: SearchResult[] = []
      let result: BrowsePage
      let fetched = 0
      do {
        result = await api<BrowsePage>(
          `/films/browse?${browseParams(filters.value, from + fetched)}`,
        )
        if (mine !== request) return
        found.push(...result.results)
        fetched++
      } while (
        filters.value.hideSeen &&
        found.filter((f) => f.watch_count === 0).length < TOP_UP_TO &&
        result.page < result.total_pages &&
        fetched < TOP_UP_PAGES
      )
      browsed.value = from === 1 ? found : [...browsed.value, ...found]
      page.value = result
      roles.value = { roles: result.roles, role: result.role }
    } finally {
      if (mine === request) browsing.value = false
    }
  }

  // Hiding seen films is done by the caller, so toggling it doesn't reload anything.
  watch(
    () => (filtering.value ? browseParams(filters.value, 1).toString() : ''),
    () => {
      browsed.value = []
      page.value = null
      if (filtering.value) browse()
    },
    { immediate: true },
  )
  watch(
    () => filters.value.person?.id,
    () => (roles.value = { roles: [], role: null }),
  )

  const more = computed(() => Boolean(page.value && page.value.page < page.value.total_pages))
  const loadMore = () => page.value && browse(page.value.page + 1)

  return { filtering, browsed, page, browsing, roles, more, loadMore }
}
