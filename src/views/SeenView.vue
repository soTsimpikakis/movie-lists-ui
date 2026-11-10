<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, post } from '@/api/client'
import type { BrowsePage, Checklist, SearchResult, SeenResult } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import FilmFilters, { type Filters } from '@/components/FilmFilters.vue'
import PosterTile from '@/components/PosterTile.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'
import { useRewardsStore } from '@/stores/rewards'

// "Movies I've seen" (design.md §5.3): onboarding right after the invite, and "Update my
// library" any time later. Ticked films become undated "before Movie Club" watches.
const route = useRoute()
const router = useRouter()
const rewards = useRewardsStore()
const welcome = computed(() => route.query.welcome === '1')

const checklist = ref<Checklist | null>(null)
const ticked = ref(new Set<number>())
const busy = ref(false)
const error = ref('')
const search = useFilmSearch()
const { query, results } = search

onMounted(async () => {
  checklist.value = await api<Checklist>('/checklist')
})

// Director / year / genre filters, for ticking off whole filmographies or years at once.
const filters = ref<Filters>({ director: null, year: null, genre: null })
const filtering = computed(() =>
  Boolean(filters.value.director || filters.value.year || filters.value.genre),
)
const browsed = ref<SearchResult[]>([])
const browsePage = ref<BrowsePage | null>(null)
const browsing = ref(false)
let browseRequest = 0

async function browse(page = 1) {
  const { director, year, genre } = filters.value
  const params = new URLSearchParams({ page: String(page) })
  if (director) params.set('director', String(director.id))
  if (year) params.set('year', String(year))
  if (genre) params.set('genre', String(genre))
  const mine = ++browseRequest
  browsing.value = true
  try {
    const result = await api<BrowsePage>(`/films/browse?${params}`)
    if (mine !== browseRequest) return
    browsed.value = page === 1 ? result.results : [...browsed.value, ...result.results]
    browsePage.value = result
  } finally {
    if (mine === browseRequest) browsing.value = false
  }
}

watch(
  filters,
  () => {
    browsed.value = []
    browsePage.value = null
    if (filtering.value) browse()
  },
  { deep: true },
)

const tickable = computed(() => browsed.value.filter((f) => f.watch_count === 0))
const allTicked = computed(
  () => tickable.value.length > 0 && tickable.value.every((f) => ticked.value.has(f.tmdb_id)),
)

/** Tick every unseen film in the results so far, or untick them all if they already are. */
function tickAll() {
  const next = new Set(ticked.value)
  for (const f of tickable.value) {
    if (allTicked.value) next.delete(f.tmdb_id)
    else next.add(f.tmdb_id)
  }
  ticked.value = next
}

function toggle(tmdbId: number) {
  const next = new Set(ticked.value)
  if (!next.delete(tmdbId)) next.add(tmdbId)
  ticked.value = next
}

async function save() {
  busy.value = true
  error.value = ''
  try {
    const { events } = await post<SeenResult>('/watches/seen', { tmdb_ids: [...ticked.value] })
    rewards.push(events)
    await router.replace({ name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page wide">
    <template v-if="welcome">
      <h1>What have you already seen?</h1>
      <p>
        Tick off the films you've watched so far and your sets start with real progress. You can
        always come back to this later from your watched list.
      </p>
    </template>
    <template v-else>
      <RouterLink :to="{ name: 'home' }" class="button-link plain small back">
        <AppIcon name="back" :size="14" /> Watched
      </RouterLink>
      <h1>Movies I've seen</h1>
      <p class="muted">
        Tick films you watched before Movie Club. Films you've already logged are ticked.
      </p>
    </template>

    <SearchField
      v-model="query"
      class="search"
      placeholder="Find another film…"
      label="Search for a film you've seen"
    />

    <FilmFilters v-model="filters" />

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
            :checked="film.watch_count > 0 || ticked.has(film.tmdb_id)"
            :disabled="film.watch_count > 0"
            @click="toggle(film.tmdb_id)"
          />
        </li>
      </ul>
    </section>

    <section v-else-if="filtering" aria-live="polite">
      <div class="results-heading">
        <h2>
          Matching films <span class="count" v-if="browsePage">· {{ browsePage.total }}</span>
        </h2>
        <button
          v-if="tickable.length"
          class="mustard small"
          :aria-pressed="allTicked"
          @click="tickAll"
        >
          <AppIcon :name="allTicked ? 'close' : 'check'" :size="14" />
          {{ allTicked ? 'Untick all' : `Tick all ${tickable.length}` }}
        </button>
      </div>
      <p v-if="browsing && !browsed.length" class="muted">Looking…</p>
      <p v-else-if="browsePage && !browsed.length" class="muted">No films match these filters.</p>
      <ul class="film-grid">
        <li v-for="film in browsed" :key="film.tmdb_id">
          <PosterTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :checked="film.watch_count > 0 || ticked.has(film.tmdb_id)"
            :disabled="film.watch_count > 0"
            @click="toggle(film.tmdb_id)"
          />
        </li>
      </ul>
      <button
        v-if="browsePage && browsePage.page < browsePage.total_pages"
        class="plain load-more"
        :disabled="browsing"
        @click="browse(browsePage.page + 1)"
      >
        <AppIcon name="chevron-down" /> {{ browsing ? 'Loading…' : 'Load more' }}
      </button>
    </section>

    <p v-if="checklist === null" class="muted">Loading…</p>
    <template v-else-if="!search.active.value && !filtering">
      <section v-for="s in checklist.sets" :key="s.id">
        <h2>{{ s.title }}</h2>
        <ul class="film-grid">
          <li v-for="film in s.films" :key="film.tmdb_id">
            <PosterTile
              :title="film.title"
              :year="film.year"
              :poster-path="film.poster_path"
              :checked="film.seen || ticked.has(film.tmdb_id)"
              :disabled="film.seen"
              @click="toggle(film.tmdb_id)"
            />
          </li>
        </ul>
      </section>

      <section v-if="checklist.popular.length">
        <h2>Popular films</h2>
        <ul class="film-grid">
          <li v-for="film in checklist.popular" :key="film.tmdb_id">
            <PosterTile
              :title="film.title"
              :year="film.year"
              :poster-path="film.poster_path"
              :checked="film.seen || ticked.has(film.tmdb_id)"
              :disabled="film.seen"
              @click="toggle(film.tmdb_id)"
            />
          </li>
        </ul>
      </section>
    </template>

    <TmdbCredit />

    <div class="action-bar">
      <RouterLink v-if="welcome" :to="{ name: 'home' }" class="button-link plain skip">
        Skip for now
      </RouterLink>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="!ticked.size || busy" @click="save">
        <AppIcon name="check" :size="14" />
        {{ busy ? 'Saving…' : ticked.size ? `Save ${ticked.size} films` : 'Tick films to save' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.back {
  margin-bottom: 1rem;
}

h1 {
  margin: 0.25rem 0 0.5rem;
  font-size: 1.6rem;
}

h2 {
  font-size: 1rem;
  margin: 1.75rem 0 0.75rem;
}

.search {
  margin-top: 0.75rem;
}

.results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1.5rem 0 0.75rem;
}

.results-heading h2 {
  margin: 0;
}

.count {
  color: var(--red);
}

.load-more {
  width: 100%;
  margin-top: 1.25rem;
}

.action-bar .error {
  flex-basis: 100%;
}

.skip {
  white-space: nowrap;
}
</style>
