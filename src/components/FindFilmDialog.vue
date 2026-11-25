<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import type { SearchResult } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import FilmFilters from '@/components/FilmFilters.vue'
import PosterTile from '@/components/PosterTile.vue'
import SearchField from '@/components/SearchField.vue'
import { useFilmBrowse } from '@/composables/useFilmBrowse'
import { useFilmSearch } from '@/composables/useFilmSearch'
import { emptyFilters, type Filters } from '@/lib/filters'
import { ratingNote } from '@/lib/format'

// Finding a film to log: a title search plus the same person / years / genre filters as
// "Movies I've seen". It stays mounted while closed, so reopening it keeps the search, the
// filters and the scroll, which suits logging several films from one filmography.
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ pick: [film: SearchResult]; close: [] }>()

const search = useFilmSearch()
const { query, results } = search
const filters = ref<Filters>(emptyFilters())
const { filtering, browsed, page, browsing, roles, more, loadMore } = useFilmBrowse(filters)

const field = ref<InstanceType<typeof SearchField>>()

const hidden = (f: SearchResult) => filters.value.hideSeen && f.watch_count > 0
const shownResults = computed(() => results.value.filter((f) => !hidden(f)))
const shownBrowsed = computed(() => browsed.value.filter((f) => !hidden(f)))

const seenNote = (f: SearchResult) => (f.watch_count ? `seen ×${f.watch_count}` : undefined)

// The page behind doesn't scroll while the dialog is open.
watch(
  () => props.open,
  async (open) => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (open) {
      await nextTick()
      field.value?.focus()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => (document.documentElement.style.overflow = ''))

/** A film was just logged: count it on its tile, wherever it shows. */
function markLogged(tmdbId: number) {
  const bump = (f: SearchResult) =>
    f.tmdb_id === tmdbId ? { ...f, watch_count: f.watch_count + 1 } : f
  results.value = results.value.map(bump)
  browsed.value = browsed.value.map(bump)
}

defineExpose({ markLogged })
</script>

<template>
  <div v-show="open" class="backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="find-film-title">
      <div class="top">
        <h2 id="find-film-title">Log a film</h2>
        <button type="button" class="plain small" aria-label="Close" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <SearchField
        ref="field"
        v-model="query"
        placeholder="Search by title…"
        label="Search films to log"
      />
      <FilmFilters v-model="filters" :roles="roles.roles" :role="roles.role" />

      <div class="results" aria-live="polite">
        <template v-if="search.active.value">
          <p v-if="search.error.value" class="error">{{ search.error.value }}</p>
          <p v-else-if="search.searching.value && !results.length" class="muted">Searching…</p>
          <p v-else-if="!results.length" class="muted">No films found.</p>
          <p v-else-if="!shownResults.length" class="muted">You've seen them all already.</p>
          <ul class="film-grid">
            <li v-for="film in shownResults" :key="film.tmdb_id">
              <PosterTile
                :title="film.title"
                :year="film.year"
                :poster-path="film.poster_path"
                :note="seenNote(film)"
                :rating="ratingNote(film.vote_average, film.vote_count)"
                @click="emit('pick', film)"
              />
            </li>
          </ul>
        </template>

        <template v-else-if="filtering">
          <h3>
            Matching films
            <span v-if="page && !filters.hideSeen" class="count">· {{ page.total }}</span>
          </h3>
          <p v-if="browsing && !browsed.length" class="muted">Looking…</p>
          <p v-else-if="page && !browsed.length" class="muted">No films match these filters.</p>
          <p v-else-if="page && !shownBrowsed.length" class="muted">
            You've seen everything here already.
          </p>
          <ul class="film-grid">
            <li v-for="film in shownBrowsed" :key="film.tmdb_id">
              <PosterTile
                :title="film.title"
                :year="film.year"
                :poster-path="film.poster_path"
                :note="seenNote(film)"
                :rating="ratingNote(film.vote_average, film.vote_count)"
                @click="emit('pick', film)"
              />
            </li>
          </ul>
          <button v-if="more" class="plain load-more" :disabled="browsing" @click="loadMore">
            <AppIcon name="chevron-down" /> {{ browsing ? 'Loading…' : 'Load more' }}
          </button>
        </template>

        <p v-else class="muted hint">
          Search by title, or use the filters to browse by person, years or genre.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Over the sticky tabs (10), under the log sheet (14), which opens on top when a film is
   picked. */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(42 26 18 / 0.6);
}

/* Full screen on phones; a tall panel on wider screens. */
.dialog {
  width: 100%;
  height: 100dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
  background: var(--bg);
}

@media (min-width: 700px) {
  .backdrop {
    align-items: center;
  }

  .dialog {
    max-width: 60rem;
    height: 90dvh;
    padding: 1.25rem 1.5rem 1.5rem;
    border-radius: 1.1rem;
  }
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

h2 {
  margin: 0;
  font-size: 1.3rem;
}

h3 {
  font-size: 1rem;
  margin: 0.5rem 0 0.75rem;
}

.count {
  color: var(--red);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.hint {
  margin: 0.5rem 0 0;
}

.load-more {
  width: 100%;
  margin-top: 1.25rem;
}
</style>
