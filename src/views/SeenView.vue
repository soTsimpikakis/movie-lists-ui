<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, post } from '@/api/client'
import type { Checklist } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import FilmTile from '@/components/FilmTile.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'

// "Movies I've seen" (design.md §5.3): onboarding right after the invite, and "Update my
// library" any time later. Ticked films become undated "before Movie Club" watches.
const route = useRoute()
const router = useRouter()
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

function toggle(tmdbId: number) {
  const next = new Set(ticked.value)
  if (!next.delete(tmdbId)) next.add(tmdbId)
  ticked.value = next
}

async function save() {
  busy.value = true
  error.value = ''
  try {
    await post('/watches/seen', { tmdb_ids: [...ticked.value] })
    await router.replace({ name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page">
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
            :checked="film.watch_count > 0 || ticked.has(film.tmdb_id)"
            :disabled="film.watch_count > 0"
            @click="toggle(film.tmdb_id)"
          />
        </li>
      </ul>
    </section>

    <p v-if="checklist === null" class="muted">Loading…</p>
    <template v-else-if="!search.active.value">
      <section v-for="s in checklist.sets" :key="s.id">
        <h2>{{ s.title }}</h2>
        <ul class="film-grid">
          <li v-for="film in s.films" :key="film.tmdb_id">
            <FilmTile
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
            <FilmTile
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

.action-bar .error {
  flex-basis: 100%;
}

.skip {
  white-space: nowrap;
}
</style>
