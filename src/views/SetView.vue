<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, post } from '@/api/client'
import type { SearchResult, SetDetail, SetFilm } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FilmTile from '@/components/FilmTile.vue'
import LogSheet from '@/components/LogSheet.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'

const route = useRoute()
const id = Number(route.params.id)

const set = ref<SetDetail | null>(null)
const notFound = ref(false)
// "I've seen these" mode: tap greyed posters to tick them, then save (design.md §5.3).
const selecting = ref(false)
const ticked = ref(new Set<number>())
const picked = ref<SearchResult | null>(null)
const busy = ref(false)
const toast = ref('')

const complete = computed(() => set.value && set.value.watched === set.value.total)

async function load() {
  try {
    set.value = await api<SetDetail>(`/sets/${id}`)
  } catch {
    notFound.value = true
  }
}

onMounted(load)

function flash(message: string) {
  toast.value = message
  setTimeout(() => (toast.value = ''), 2500)
}

function tap(film: SetFilm) {
  if (film.watched) return
  if (selecting.value) {
    const next = new Set(ticked.value)
    if (!next.delete(film.tmdb_id)) next.add(film.tmdb_id)
    ticked.value = next
  } else {
    picked.value = { ...film, watch_count: 0 }
  }
}

function cancelSelecting() {
  selecting.value = false
  ticked.value = new Set()
}

async function saveTicked() {
  busy.value = true
  try {
    const { added } = await post<{ added: number }>('/watches/seen', {
      tmdb_ids: [...ticked.value],
    })
    cancelSelecting()
    flash(`Added ${added} film${added === 1 ? '' : 's'}`)
    await load()
  } finally {
    busy.value = false
  }
}

async function onLogged() {
  const title = picked.value?.title
  picked.value = null
  flash(`Logged ${title}`)
  await load()
}
</script>

<template>
  <main class="page">
    <AppHeader />

    <p v-if="notFound" class="muted">This set doesn't exist.</p>
    <template v-else-if="set">
      <section class="ticket">
        <div class="heading">
          <h2>{{ set.title }}</h2>
          <span class="progress">
            {{ complete ? 'Complete ✓' : `${set.watched} of ${set.total}` }}
          </span>
        </div>
        <TicketProgress :watched="set.watched" :total="set.total" />
        <span class="to-go">
          {{ complete ? 'Every film watched. Take a bow.' : `${set.total - set.watched} to go.` }}
        </span>
      </section>

      <div v-if="!complete" class="hint-row">
        <span class="muted">
          {{ selecting ? "Tap the films you've already seen" : 'Tap a film to log it' }}
        </span>
        <button v-if="!selecting" class="mustard small" @click="selecting = true">
          <AppIcon name="check" :size="14" /> Tick off seen
        </button>
      </div>

      <ul class="film-grid">
        <li v-for="film in set.films" :key="film.film_id">
          <FilmTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :muted="!film.watched && !ticked.has(film.tmdb_id)"
            :checked="ticked.has(film.tmdb_id)"
            :disabled="film.watched"
            @click="tap(film)"
          />
        </li>
      </ul>

      <div v-if="selecting" class="action-bar">
        <button class="plain" @click="cancelSelecting">
          <AppIcon name="close" :size="14" /> Cancel
        </button>
        <button :disabled="!ticked.size || busy" @click="saveTicked">
          <AppIcon name="check" :size="14" /> Save {{ ticked.size || '' }} as seen
        </button>
      </div>
    </template>

    <TmdbCredit />

    <LogSheet v-if="picked" :film="picked" @logged="onLogged" @close="picked = null" />
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </main>
</template>

<style scoped>
.ticket {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #2a1a12;
  color: #f6ebd9;
  --hole-on: #f6ebd9;
  --hole-off: #8a7360;
}

.heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.heading h2 {
  margin: 0;
  font-size: 1.5rem;
}

.progress {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mustard);
  white-space: nowrap;
}

.to-go {
  font-size: 0.85rem;
  color: #e8d9c2;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1rem 0;
}

.ticket + .film-grid {
  margin-top: 1.25rem;
}
</style>
