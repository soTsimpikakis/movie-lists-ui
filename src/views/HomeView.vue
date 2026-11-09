<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SearchResult, Watch } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import FilmTile from '@/components/FilmTile.vue'
import LogSheet from '@/components/LogSheet.vue'
import PosterImage from '@/components/PosterImage.vue'
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
const groups = computed(() => {
  const all = watches.value ?? []
  return [
    { key: 'dated', title: null, items: all.filter((w) => w.watched_on) },
    { key: 'undated', title: 'Before Movie Club', items: all.filter((w) => !w.watched_on) },
  ].filter((g) => g.items.length)
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

    <input
      v-model="query"
      class="search"
      type="search"
      placeholder="Log a film…"
      enterkeyhint="search"
      autocomplete="off"
      aria-label="Search films to log"
    />

    <section v-if="search.active.value" aria-live="polite">
      <p v-if="search.error.value" class="error">{{ search.error.value }}</p>
      <p v-else-if="search.searching.value && !results.length" class="muted">Searching…</p>
      <p v-else-if="!results.length" class="muted">No films found.</p>
      <ul class="film-grid">
        <li v-for="film in results" :key="film.tmdb_id">
          <FilmTile
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
        <RouterLink :to="{ name: 'seen' }" class="button-link">
          tick off films you've already seen
        </RouterLink>
      </div>
      <template v-else>
        <div class="list-heading">
          <h2>
            Watched <span class="muted">· {{ watches.length }}</span>
          </h2>
          <RouterLink :to="{ name: 'seen' }">Update my library</RouterLink>
        </div>

        <template v-for="group in groups" :key="group.key">
          <h3 v-if="group.title" class="group-heading">
            {{ group.title }} <span class="muted">· {{ group.items.length }}</span>
          </h3>
          <ul class="watches">
            <li v-for="w in group.items" :key="w.id">
              <RouterLink class="watch" :to="{ name: 'watch', params: { id: w.id } }">
                <PosterImage
                  class="thumb"
                  :path="w.film.poster_path"
                  :title="w.film.title"
                  size="w92"
                />
                <span class="watch-main">
                  <span class="watch-title">
                    {{ w.film.title }}
                    <span v-if="w.film.favourite" class="heart" aria-label="Favourite">♥</span>
                  </span>
                  <span class="muted small">
                    {{ w.watched_on ? formatDate(w.watched_on) : (w.film.year ?? '') }}
                    <template v-if="w.watch_number > 1">
                      · {{ ordinal(w.watch_number) }} watch
                    </template>
                  </span>
                </span>
                <span
                  v-if="w.reaction"
                  class="reaction"
                  :title="reactions.byKey.get(w.reaction)?.label"
                >
                  {{ reactions.byKey.get(w.reaction)?.emoji }}
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
  width: 100%;
  margin-bottom: 1rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.small {
  font-size: 0.8rem;
}

.empty p {
  margin-bottom: 0.5rem;
}

.list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.list-heading h2 {
  font-size: 1rem;
  margin: 0;
}

.group-heading {
  font-size: 0.95rem;
  margin: 1.5rem 0 0.25rem;
}

.watches li + li {
  border-top: 1px solid var(--border);
}

.watch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  color: inherit;
  text-decoration: none;
}

.thumb {
  width: 2.75rem;
  flex: none;
}

.watch-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.watch-title {
  font-weight: 500;
}

.heart {
  color: var(--accent);
}

.reaction {
  font-size: 1.5rem;
}
</style>
