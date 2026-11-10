<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SearchResult, Watch } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import PosterTile from '@/components/PosterTile.vue'
import LogSheet from '@/components/LogSheet.vue'
import PosterImage from '@/components/PosterImage.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'
import { formatDate, ordinal } from '@/lib/format'
import { useReactionsStore } from '@/stores/reactions'

const reactions = useReactionsStore()
const search = useFilmSearch()
const { query, results } = search

const watches = ref<Watch[] | null>(null)
const picked = ref<SearchResult | null>(null)
const toast = ref('')

// Undated watches come from "Movies I've seen" and get their own section (design.md §5.3).
// The undated section always shows, since its heading holds "Update my library".
const groups = computed(() => {
  const all = watches.value ?? []
  return [
    { key: 'dated', items: all.filter((w) => w.watched_on) },
    { key: 'undated', items: all.filter((w) => !w.watched_on) },
  ]
})

async function loadWatches() {
  watches.value = await api<Watch[]>('/watches')
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
          Watched <span class="count">· {{ watches.length }}</span>
        </h2>

        <template v-for="group in groups" :key="group.key">
          <div v-if="group.key === 'undated'" class="group-heading">
            <h3>Before Movie Club · {{ group.items.length }}</h3>
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
              <RouterLink class="watch" :to="{ name: 'watch', params: { id: w.id } }">
                <PosterImage
                  class="thumb"
                  :path="w.film.poster_path"
                  :title="w.film.title"
                  size="w185"
                />
                <span class="watch-main">
                  <span class="watch-title">
                    {{ w.film.title }}
                    <span v-if="w.film.favourite" class="heart" aria-label="Favourite">♥</span>
                  </span>
                  <span class="meta">
                    {{ w.watched_on ? formatDate(w.watched_on) : (w.film.year ?? '') }}
                    <template v-if="w.watch_number > 1">
                      · {{ ordinal(w.watch_number) }} watch
                    </template>
                  </span>
                </span>
                <span
                  class="stub emoji"
                  :title="w.reaction ? reactions.byKey.get(w.reaction)?.label : undefined"
                >
                  {{ w.reaction ? reactions.byKey.get(w.reaction)?.emoji : '' }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </template>
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

/* Each watch is a ticket stub; the reaction is stamped on the red end. */
.watch {
  position: relative;
  display: flex;
  align-items: stretch;
  /* Ticket proportions: about 3:8, capped so desktop tickets don't get huge. */
  aspect-ratio: 8 / 3;
  max-height: 9rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.6rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  text-decoration: none;
}

.watch .thumb {
  width: auto;
  height: 100%;
  flex: none;
  aspect-ratio: 2 / 3;
  border-radius: calc(0.6rem - 2px) 0 0 calc(0.6rem - 2px);
  border-right: 2px solid var(--ticket-line);
}

.watch-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0.75rem;
}

.watch-title {
  font-family: var(--ticket-title);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.meta {
  font-family: var(--ticket-type);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--parchment-muted);
}

.heart {
  color: var(--red);
}

.stub {
  width: 4.2rem;
  flex: none;
  display: grid;
  place-items: center;
  padding-right: 0.7rem;
  border-left: 2px dashed var(--ticket-line);
  background: var(--red);
  color: var(--on-red);
  /* Covers the ticket's outline, so the colour runs right to the edge. */
  margin: -2px -2px -2px 0;
  border-radius: 0 0.6rem 0.6rem 0;
  font-size: 1.75rem;
}

/* The punched notch: a real cut-out, so the shadow and whatever lies below show through. */
.watch {
  mask: radial-gradient(circle at 100% 50%, #0000 0.9rem, #000 calc(0.9rem + 0.5px));
}
</style>
