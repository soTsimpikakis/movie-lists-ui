<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api/client'
import type { LibraryFilm, LibraryPage } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FilmTile from '@/components/FilmTile.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'

// Every film you've watched, once each, newest to the library first, a page at a time.
// Search runs on the server, so it covers the whole library, not just the loaded pages.
// Tapping a film opens its latest watch.
const PAGE = 24
const router = useRouter()
const films = ref<LibraryFilm[] | null>(null)
const total = ref(0)
const libraryTotal = ref(0)
const nextOffset = ref<number | null>(null)
const loadingMore = ref(false)
const query = ref('')
let request = 0

async function load(more = false) {
  const mine = ++request
  const offset = more ? (nextOffset.value ?? 0) : 0
  const q = encodeURIComponent(query.value.trim())
  const page = await api<LibraryPage>(`/library?q=${q}&offset=${offset}&limit=${PAGE}`)
  // A newer search started while this one was in flight; its result wins.
  if (mine !== request) return
  films.value = more ? [...(films.value ?? []), ...page.items] : page.items
  nextOffset.value = page.next_offset
  total.value = page.total
  if (!query.value.trim()) libraryTotal.value = page.total
}

async function loadMore() {
  loadingMore.value = true
  try {
    await load(true)
  } finally {
    loadingMore.value = false
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined
watch(query, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => load(), 250)
})

onMounted(() => load())
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <div class="heading">
      <h2>
        Library <span class="count">· {{ libraryTotal }}</span>
      </h2>
      <RouterLink
        :to="{ name: 'seen' }"
        class="button-link mustard small"
        aria-label="Update my library"
        title="Update my library"
      >
        <AppIcon name="plus" :size="13" /><AppIcon name="library" :size="17" />
      </RouterLink>
    </div>

    <SearchField
      v-model="query"
      class="search"
      placeholder="Search your films…"
      label="Search your watched films"
    />

    <p v-if="films === null" class="muted">Loading…</p>
    <p v-else-if="!libraryTotal" class="muted">
      Nothing here yet. Log a film from Watched, or tick off ones you've seen.
    </p>
    <p v-else-if="!films.length" class="muted">No watched film matches “{{ query }}”.</p>
    <ul class="film-grid">
      <li v-for="f in films ?? []" :key="f.film.id">
        <FilmTile
          :title="f.film.title"
          :year="f.film.year"
          :poster-path="f.film.poster_path"
          :watch-count="f.watch_count"
          @click="router.push({ name: 'watch', params: { id: f.latest_watch_id } })"
        />
      </li>
    </ul>
    <button
      v-if="nextOffset !== null"
      class="plain load-more"
      :disabled="loadingMore"
      @click="loadMore"
    >
      <AppIcon name="chevron-down" />
      {{ loadingMore ? 'Loading…' : `Load more · ${total - (films?.length ?? 0)} left` }}
    </button>

    <TmdbCredit />
  </main>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.heading h2 {
  margin: 0;
  font-size: 1.15rem;
}

.heading .button-link {
  gap: 0.15rem;
}

.count {
  color: var(--red);
}

.search {
  margin-bottom: 1.25rem;
}

.load-more {
  width: 100%;
  margin-top: 1.5rem;
}
</style>
