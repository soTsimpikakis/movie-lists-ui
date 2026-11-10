<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SearchResult, Watch, WatchPage } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import PosterTile from '@/components/PosterTile.vue'
import LogSheet from '@/components/LogSheet.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import WatchTicket from '@/components/WatchTicket.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'
import { useReactionsStore } from '@/stores/reactions'

const reactions = useReactionsStore()
const search = useFilmSearch()
const { query, results } = search

const PAGE = 20
const watches = ref<Watch[] | null>(null)
const nextOffset = ref<number | null>(null)
const totals = ref({ dated: 0, undated: 0 })
const loadingMore = ref(false)
const picked = ref<SearchResult | null>(null)
const toast = ref('')

// Undated watches come from "Movies I've seen" and get their own section (design.md §5.3).
// The API sends every dated watch before any undated one, so that section appears once the
// dated ones are all loaded. It then always shows, since its heading holds "Update my library".
const groups = computed(() => {
  const all = watches.value ?? []
  const undated = all.filter((w) => !w.watched_on)
  return [
    { key: 'dated', items: all.filter((w) => w.watched_on), show: true },
    { key: 'undated', items: undated, show: undated.length > 0 || nextOffset.value === null },
  ]
})

/** Newest added first, a page at a time; `more` appends the next page for "Load more". */
async function loadWatches(more = false) {
  const offset = more ? (nextOffset.value ?? 0) : 0
  const page = await api<WatchPage>(`/watches?offset=${offset}&limit=${PAGE}`)
  watches.value = more ? [...(watches.value ?? []), ...page.items] : page.items
  nextOffset.value = page.next_offset
  totals.value = { dated: page.dated_total, undated: page.undated_total }
}

async function loadMore() {
  loadingMore.value = true
  try {
    await loadWatches(true)
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  loadWatches()
  reactions.load()
})

async function onLogged(logged: Watch) {
  picked.value = null
  query.value = ''
  toast.value = `Logged ${logged.film.title}`
  setTimeout(() => (toast.value = ''), 2500)
  await loadWatches()
}
</script>

<template>
  <main class="page">
    <AppHeader />

    <SearchField
      v-model="query"
      class="search"
      placeholder="Log a film…"
      label="Search films to log"
    />

    <section v-if="search.active.value" aria-live="polite">
      <p v-if="search.error.value" class="error">{{ search.error.value }}</p>
      <p v-else-if="search.searching.value && !results.length" class="muted">Searching…</p>
      <p v-else-if="!results.length" class="muted">No films found.</p>
      <ul class="film-grid">
        <li v-for="film in results" :key="film.tmdb_id">
          <PosterTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :note="film.watch_count ? `seen ×${film.watch_count}` : undefined"
            @click="picked = film"
          />
        </li>
      </ul>
    </section>

    <section v-else>
      <p v-if="watches === null" class="muted">Loading…</p>
      <div v-else-if="!watches.length" class="empty">
        <p class="muted">Nothing logged yet. Search for the last film you watched, or</p>
        <RouterLink :to="{ name: 'seen' }" class="button-link mustard">
          <AppIcon name="check" /> Tick off films you've already seen
        </RouterLink>
      </div>
      <template v-else>
        <h2 class="list-heading">
          Watched <span class="count">· {{ totals.dated + totals.undated }}</span>
        </h2>

        <template v-for="group in groups.filter((g) => g.show)" :key="group.key">
          <div v-if="group.key === 'undated'" class="group-heading">
            <h3>Before Movie Club · {{ totals.undated }}</h3>
            <RouterLink
              :to="{ name: 'seen' }"
              class="button-link mustard small"
              aria-label="Update my library"
              title="Update my library"
            >
              <AppIcon name="plus" :size="13" /><AppIcon name="library" :size="17" />
            </RouterLink>
          </div>
          <p v-if="group.key === 'undated' && !group.items.length" class="muted hint">
            Films you saw before joining. Tick them off to fill your sets.
          </p>
          <ul class="watches" :class="group.key">
            <li v-for="w in group.items" :key="w.id">
              <WatchTicket :watch="w" />
            </li>
          </ul>
        </template>
        <button
          v-if="nextOffset !== null"
          class="plain load-more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <AppIcon name="chevron-down" /> {{ loadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </template>
    </section>

    <TmdbCredit />

    <LogSheet v-if="picked" :film="picked" @logged="onLogged" @close="picked = null" />
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </main>
</template>

<style scoped>
.search {
  margin-bottom: 1.25rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.empty p {
  margin-bottom: 0.75rem;
}

.list-heading {
  font-size: 1.15rem;
  margin: 0 0 0.9rem;
}

.count {
  color: var(--red);
}

.group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1.75rem 0 0.75rem;
}

.group-heading h3 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.group-heading .button-link {
  gap: 0.15rem;
}

.hint {
  margin: 0;
  font-size: 0.9rem;
}

.watches {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Tickets lie on the page: a shadow that follows the notch, and a slight, varying tilt. */
.watches li {
  filter: var(--ticket-shadow);
}

.watches li:nth-child(3n + 1) {
  transform: rotate(-0.5deg);
}

.watches li:nth-child(3n + 2) {
  transform: rotate(0.4deg) translateX(2px);
}

.watches li:nth-child(3n) {
  transform: rotate(-0.15deg) translateX(-1px);
}

.load-more {
  width: 100%;
  margin-top: 1.25rem;
}
</style>
