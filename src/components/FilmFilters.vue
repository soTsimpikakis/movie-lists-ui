<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { api } from '@/api/client'
import type { Genre, Person } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

export interface Filters {
  director: Person | null
  year: number | null
  genre: number | null
}

// Director / year / genre filters for finding films to tick off in bulk. The director is
// picked from a people search, so namesakes can be told apart by what they're known for.
const filters = defineModel<Filters>({ required: true })

const thisYear = new Date().getFullYear()
const years = Array.from({ length: thisYear - 1919 }, (_, i) => thisYear - i)
const genres = ref<Genre[]>([])
const personQuery = ref('')
const people = ref<Person[]>([])
let debounce: ReturnType<typeof setTimeout> | undefined
let request = 0

onMounted(async () => {
  genres.value = await api<Genre[]>('/genres')
})

watch(personQuery, (q) => {
  clearTimeout(debounce)
  if (!q.trim()) {
    people.value = []
    return
  }
  debounce = setTimeout(async () => {
    const mine = ++request
    const found = await api<Person[]>(`/people/search?q=${encodeURIComponent(q.trim())}`)
    if (mine === request) people.value = found
  }, 300)
})

function pick(person: Person) {
  filters.value = { ...filters.value, director: person }
  personQuery.value = ''
  people.value = []
}

function set<K extends keyof Filters>(key: K, value: Filters[K]) {
  filters.value = { ...filters.value, [key]: value }
}

function setNumber(key: 'year' | 'genre', event: Event) {
  const value = (event.target as HTMLSelectElement).value
  set(key, value ? Number(value) : null)
}

function clearAll() {
  filters.value = { director: null, year: null, genre: null }
}
</script>

<template>
  <div class="filters" role="group" aria-label="Filter films">
    <div class="director">
      <button
        v-if="filters.director"
        type="button"
        class="chip small"
        :aria-label="`Remove director filter ${filters.director.name}`"
        @click="set('director', null)"
      >
        <span class="chip-label">Dir.</span> {{ filters.director.name }}
        <AppIcon name="close" :size="12" />
      </button>
      <template v-else>
        <input
          v-model="personQuery"
          type="search"
          placeholder="Director…"
          autocomplete="off"
          aria-label="Filter by director"
        />
        <ul v-if="people.length" class="suggestions">
          <li v-for="p in people" :key="p.id">
            <button type="button" class="plain suggestion" @click="pick(p)">
              <span class="name">{{ p.name }}</span>
              <span class="known">
                {{ [p.department, ...p.known_for].filter(Boolean).join(' · ') }}
              </span>
            </button>
          </li>
        </ul>
      </template>
    </div>

    <select
      :value="filters.year ?? ''"
      aria-label="Filter by year"
      @change="setNumber('year', $event)"
    >
      <option value="">Any year</option>
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>

    <select
      :value="filters.genre ?? ''"
      aria-label="Filter by genre"
      @change="setNumber('genre', $event)"
    >
      <option value="">Any genre</option>
      <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
    </select>

    <button
      v-if="filters.director || filters.year || filters.genre"
      type="button"
      class="plain small clear"
      @click="clearAll"
    >
      <AppIcon name="close" :size="12" /> Clear filters
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.director {
  position: relative;
  grid-column: 1 / -1;
}

.director input {
  width: 100%;
}

select {
  width: 100%;
  appearance: none;
  padding-right: 2rem;
  background-image:
    linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position:
    calc(100% - 1.1rem) 55%,
    calc(100% - 0.75rem) 55%;
  background-size: 0.35rem 0.35rem;
  background-repeat: no-repeat;
  cursor: pointer;
}

.chip {
  max-width: 100%;
  background: var(--fg);
  color: var(--bg);
  border-radius: 999px;
}

.chip-label {
  font-family: var(--mono);
  font-size: 0.75rem;
  opacity: 0.75;
}

.suggestions {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  top: calc(100% + 0.3rem);
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.2);
}

.suggestion {
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.5rem 0.6rem;
  border: 0;
  box-shadow: none;
  text-align: left;
}

.suggestion:hover,
.suggestion:focus-visible {
  background: var(--bg);
}

.known {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--muted);
}

.clear {
  grid-column: 1 / -1;
  justify-self: start;
}

@media (min-width: 900px) {
  .filters {
    grid-template-columns: 2fr 1fr 1fr auto;
    align-items: center;
  }

  .director,
  .clear {
    grid-column: auto;
  }
}
</style>
