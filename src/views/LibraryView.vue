<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api/client'
import type { Film, Watch } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FilmTile from '@/components/FilmTile.vue'
import SearchField from '@/components/SearchField.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'

// Every film you've watched, once each, most recently watched first. Tapping one opens
// its latest watch.
const router = useRouter()
const watches = ref<Watch[] | null>(null)
const query = ref('')

const films = computed(() => {
  const byFilm = new Map<number, { film: Film; latest: Watch; count: number }>()
  // /watches is newest first, so the first watch seen per film is its latest.
  for (const w of watches.value ?? []) {
    const entry = byFilm.get(w.film.id)
    if (entry) entry.count++
    else byFilm.set(w.film.id, { film: w.film, latest: w, count: 1 })
  }
  return [...byFilm.values()]
})

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const shown = computed(() => {
  const q = fold(query.value.trim())
  return q ? films.value.filter((f) => fold(f.film.title).includes(q)) : films.value
})

onMounted(async () => {
  watches.value = await api<Watch[]>('/watches')
})
</script>

<template>
  <main class="page">
    <AppHeader />

    <div class="heading">
      <h2>
        Library <span class="count">· {{ films.length }}</span>
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

    <p v-if="watches === null" class="muted">Loading…</p>
    <p v-else-if="!films.length" class="muted">
      Nothing here yet. Log a film from Watched, or tick off ones you've seen.
    </p>
    <p v-else-if="!shown.length" class="muted">No watched film matches “{{ query }}”.</p>
    <ul class="film-grid">
      <li v-for="f in shown" :key="f.film.id">
        <FilmTile
          :title="f.film.title"
          :year="f.film.year"
          :poster-path="f.film.poster_path"
          :watch-count="f.count"
          @click="router.push({ name: 'watch', params: { id: f.latest.id } })"
        />
      </li>
    </ul>

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
</style>
