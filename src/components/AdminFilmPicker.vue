<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { useFilmSearch } from '@/composables/useFilmSearch'

export interface PickedFilm {
  tmdb_id: number
  title: string
  year: number | null
}

// A plain film search for the admin forms: type, then pick from the results. With `multiple`
// it keeps a list; otherwise picking replaces the film.
const props = defineProps<{ modelValue: PickedFilm[]; multiple?: boolean; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [PickedFilm[]] }>()

const { query, results, searching, error, active } = useFilmSearch()

function pick(film: PickedFilm) {
  const picked = { tmdb_id: film.tmdb_id, title: film.title, year: film.year }
  if (!props.multiple) emit('update:modelValue', [picked])
  else if (!props.modelValue.some((f) => f.tmdb_id === film.tmdb_id))
    emit('update:modelValue', [...props.modelValue, picked])
  query.value = ''
}

function remove(tmdbId: number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((f) => f.tmdb_id !== tmdbId),
  )
}
</script>

<template>
  <div class="picker">
    <ul v-if="modelValue.length" class="picked">
      <li v-for="f in modelValue" :key="f.tmdb_id" class="chip">
        {{ f.title }}<template v-if="f.year"> ({{ f.year }})</template>
        <button
          type="button"
          class="plain small icon"
          :aria-label="`Remove ${f.title}`"
          @click="remove(f.tmdb_id)"
        >
          <AppIcon name="close" :size="12" />
        </button>
      </li>
    </ul>
    <label>
      {{ label }}
      <input
        v-model="query"
        type="search"
        placeholder="Search TMDB for a film"
        autocomplete="off"
      />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="active && searching" class="muted">Searching…</p>
    <ul v-else-if="active && results.length" class="results">
      <li v-for="r in results.slice(0, 8)" :key="r.tmdb_id">
        <button type="button" class="plain small result" @click="pick(r)">
          <AppIcon name="plus" :size="12" />
          {{ r.title }}<template v-if="r.year"> ({{ r.year }})</template>
        </button>
      </li>
    </ul>
    <p v-else-if="active" class="muted">No films found.</p>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.picked,
.results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.3rem 0.2rem 0.7rem;
  border: 2px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-weight: 700;
}

.icon {
  padding: 0.2rem;
  border-radius: 999px;
  box-shadow: none;
}

.result {
  font-weight: 500;
}
</style>
