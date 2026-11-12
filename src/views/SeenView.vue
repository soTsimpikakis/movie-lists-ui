<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/api/client'
import type { BrowsePage, Checklist, SearchResult } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import BulkProgress from '@/components/BulkProgress.vue'
import FilmFilters from '@/components/FilmFilters.vue'
import PosterTile from '@/components/PosterTile.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'
import { saveSeen } from '@/lib/bulk'
import { browseParams, emptyFilters, type Filters, isFiltering } from '@/lib/filters'
import { ratingNote } from '@/lib/format'
import { useRewardsStore } from '@/stores/rewards'

// "Movies I've seen" (design.md §5.3): onboarding right after the invite, and "Update my
// library" any time later. Ticked films become undated "before Movie Club" watches. Saving
// keeps you on the page, filters and all, so long sessions can be saved as they go.
const route = useRoute()
const rewards = useRewardsStore()
const welcome = computed(() => route.query.welcome === '1')

const checklist = ref<Checklist | null>(null)
const ticked = ref(new Set<number>())
const busy = ref(false)
const error = ref('')
const search = useFilmSearch()
const { query, results } = search

// The "Top" button, for getting back to the filters from far down a long list.
const scrolledDown = ref(false)
const onScroll = () => (scrolledDown.value = window.scrollY > 600)

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  checklist.value = await api<Checklist>('/checklist')
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

function toTop() {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
}

// Person / years / genre filters, for ticking off whole filmographies or decades at once.
const filters = ref<Filters>(emptyFilters())
const filtering = computed(() => isFiltering(filters.value))
const browsed = ref<SearchResult[]>([])
const browsePage = ref<BrowsePage | null>(null)
const browsing = ref(false)
// The person's roles, kept while switching between them so the buttons don't flicker.
const roles = ref<{ roles: string[]; role: string | null }>({ roles: [], role: null })
let browseRequest = 0

// With library films hidden, a page can be mostly films already seen, so a load keeps
// fetching (a few pages at most) until it has something worth showing.
const TOP_UP_TO = 30
const TOP_UP_PAGES = 3

async function browse(page = 1) {
  const mine = ++browseRequest
  browsing.value = true
  try {
    const found: SearchResult[] = []
    let result: BrowsePage
    let fetched = 0
    do {
      result = await api<BrowsePage>(`/films/browse?${browseParams(filters.value, page + fetched)}`)
      if (mine !== browseRequest) return
      found.push(...result.results)
      fetched++
    } while (
      filters.value.hideSeen &&
      found.filter((f) => f.watch_count === 0).length < TOP_UP_TO &&
      result.page < result.total_pages &&
      fetched < TOP_UP_PAGES
    )
    browsed.value = page === 1 ? found : [...browsed.value, ...found]
    browsePage.value = result
    roles.value = { roles: result.roles, role: result.role }
  } finally {
    if (mine === browseRequest) browsing.value = false
  }
}

// Hiding seen films happens below, so toggling it doesn't reload anything.
watch(
  () => (filtering.value ? browseParams(filters.value, 1).toString() : ''),
  () => {
    browsed.value = []
    browsePage.value = null
    if (filtering.value) browse()
  },
)
watch(
  () => filters.value.person?.id,
  () => (roles.value = { roles: [], role: null }),
)

const hidden = (seen: boolean) => filters.value.hideSeen && seen
const shownBrowsed = computed(() => browsed.value.filter((f) => !hidden(f.watch_count > 0)))
const shownResults = computed(() => results.value.filter((f) => !hidden(f.watch_count > 0)))
const shownSets = computed(() =>
  (checklist.value?.sets ?? [])
    .map((s) => ({ ...s, films: s.films.filter((f) => !hidden(f.seen)) }))
    .filter((s) => s.films.length),
)
const shownPopular = computed(() => (checklist.value?.popular ?? []).filter((f) => !hidden(f.seen)))

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

// Big saves show the ticket-box loading screen; small ones are over before it would matter.
const BIG_SAVE = 20
const progress = ref<{ done: number; total: number } | null>(null)
const savedAny = ref(false)
const toast = ref('')

function flash(message: string) {
  toast.value = message
  setTimeout(() => (toast.value = ''), 2500)
}

/** Saved films turn into library films everywhere on the page (or vanish, when hiding). */
function markSaved(ids: number[]) {
  if (!ids.length) return
  const saved = new Set(ids)
  const inLibrary = <T extends { tmdb_id: number; watch_count: number }>(f: T): T =>
    saved.has(f.tmdb_id) && !f.watch_count ? { ...f, watch_count: 1 } : f
  browsed.value = browsed.value.map(inLibrary)
  results.value = results.value.map(inLibrary)
  if (checklist.value) {
    const seen = <T extends { tmdb_id: number; seen: boolean }>(f: T): T =>
      saved.has(f.tmdb_id) ? { ...f, seen: true } : f
    checklist.value = {
      sets: checklist.value.sets.map((s) => ({ ...s, films: s.films.map(seen) })),
      popular: checklist.value.popular.map(seen),
    }
  }
  ticked.value = new Set([...ticked.value].filter((id) => !saved.has(id)))
  savedAny.value = true
}

async function save() {
  busy.value = true
  error.value = ''
  const ids = [...ticked.value]
  // Batches that made it are kept even if a later one fails.
  let done = 0
  try {
    const { events } = await saveSeen(ids, (saved, total) => {
      done = saved
      if (total > BIG_SAVE) progress.value = { done: saved, total }
    })
    rewards.push(events)
    flash(`Saved ${ids.length} film${ids.length === 1 ? '' : 's'} to your library`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    markSaved(ids.slice(0, done))
    busy.value = false
    progress.value = null
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
        Tick films you watched before Movie Club. Films you've already logged are greyed out, or
        hide them to see only what's left.
      </p>
    </template>

    <SearchField
      v-model="query"
      class="search"
      placeholder="Find another film…"
      label="Search for a film you've seen"
    />

    <FilmFilters v-model="filters" :roles="roles.roles" :role="roles.role" />

    <section v-if="search.active.value" aria-live="polite">
      <p v-if="search.error.value" class="error">{{ search.error.value }}</p>
      <p v-else-if="search.searching.value && !results.length" class="muted">Searching…</p>
      <p v-else-if="!results.length" class="muted">No films found.</p>
      <p v-else-if="!shownResults.length" class="muted">They're all in your library already.</p>
      <ul class="film-grid">
        <li v-for="film in shownResults" :key="film.tmdb_id">
          <PosterTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :rating="ratingNote(film.vote_average, film.vote_count)"
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
          Matching films
          <span v-if="browsePage && !filters.hideSeen" class="count">· {{ browsePage.total }}</span>
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
      <p v-else-if="browsePage && !shownBrowsed.length" class="muted">
        Everything here is in your library already.
      </p>
      <ul class="film-grid">
        <li v-for="film in shownBrowsed" :key="film.tmdb_id">
          <PosterTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :rating="ratingNote(film.vote_average, film.vote_count)"
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
      <section v-for="s in shownSets" :key="s.id">
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

      <section v-if="shownPopular.length">
        <h2>Popular films</h2>
        <ul class="film-grid">
          <li v-for="film in shownPopular" :key="film.tmdb_id">
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

    <BulkProgress v-if="progress" :done="progress.done" :total="progress.total" />

    <p v-if="toast" class="toast" role="status">{{ toast }}</p>

    <div class="action-bar">
      <button v-if="scrolledDown" type="button" class="plain to-top" @click="toTop">
        <AppIcon name="chevron-up" :size="14" /> Top
      </button>
      <RouterLink v-if="welcome" :to="{ name: 'home' }" class="button-link plain skip">
        <template v-if="savedAny"><AppIcon name="check" :size="14" /> Done</template>
        <template v-else>Skip for now</template>
      </RouterLink>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="!ticked.size || busy" @click="save">
        <AppIcon name="check" :size="14" />
        {{
          busy
            ? 'Saving…'
            : ticked.size
              ? `Save ${ticked.size} film${ticked.size === 1 ? '' : 's'}`
              : 'Tick films to save'
        }}
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

/* Above the action bar, so it doesn't cover the Save button. */
.toast {
  bottom: calc(6rem + env(safe-area-inset-bottom));
}

.skip,
.to-top {
  white-space: nowrap;
}
</style>
