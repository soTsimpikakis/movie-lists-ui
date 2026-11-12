<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { api } from '@/api/client'
import type { Genre, Person } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import {
  emptyFilters,
  type Filters,
  isFiltering,
  roleLabel,
  ROLES,
  SORTS,
  type Sort,
} from '@/lib/filters'

// Person / years / genre filters for finding films to tick off in bulk, plus the order and
// whether to hide films already in the library. The person is picked from a people search
// (actors, directors, composers...), so namesakes can be told apart by what they're known for.
const filters = defineModel<Filters>({ required: true })
// The person's roles to switch between, and the one their films are listed in (from the API).
const props = defineProps<{ roles?: string[]; role?: string | null }>()

const thisYear = new Date().getFullYear()
const years = Array.from({ length: thisYear - 1919 }, (_, i) => thisYear - i)
const genres = ref<Genre[]>([])
const personQuery = ref('')
const people = ref<Person[]>([])
const active = computed(() => isFiltering(filters.value))
const currentRole = computed(
  () => filters.value.role ?? props.role ?? filters.value.person?.department ?? 'Acting',
)
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
  filters.value = { ...filters.value, person, role: null }
  personQuery.value = ''
  people.value = []
}

function set(changes: Partial<Filters>) {
  const next = { ...filters.value, ...changes }
  // A range picked backwards is still the range they meant.
  if (next.yearFrom && next.yearTo && next.yearFrom > next.yearTo) {
    ;[next.yearFrom, next.yearTo] = [next.yearTo, next.yearFrom]
  }
  filters.value = next
}

function selected(event: Event): number | null {
  const value = (event.target as HTMLSelectElement).value
  return value ? Number(value) : null
}

function clearAll() {
  const { sort, hideSeen } = filters.value
  filters.value = { ...emptyFilters(), sort, hideSeen }
}
</script>

<template>
  <div class="filters" role="group" aria-label="Filter films">
    <div class="person">
      <button
        v-if="filters.person"
        type="button"
        class="chip small"
        :aria-label="`Remove person filter ${filters.person.name}`"
        @click="set({ person: null, role: null })"
      >
        <span class="chip-label">{{ ROLES[currentRole]?.chip ?? roleLabel(currentRole) }}</span>
        {{ filters.person.name }}
        <AppIcon name="close" :size="12" />
      </button>
      <div
        v-if="filters.person && props.roles && props.roles.length > 1"
        class="roles"
        role="group"
        :aria-label="`${filters.person.name}'s films as`"
      >
        <button
          v-for="r in props.roles"
          :key="r"
          type="button"
          class="small"
          :class="r === currentRole ? 'mustard' : 'plain'"
          :aria-pressed="r === currentRole"
          @click="set({ role: r })"
        >
          {{ roleLabel(r) }}
        </button>
      </div>
      <template v-if="!filters.person">
        <input
          v-model="personQuery"
          type="search"
          placeholder="Actor, director, composer…"
          autocomplete="off"
          aria-label="Filter by person"
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

    <div class="field years">
      <select
        :value="filters.yearFrom ?? ''"
        aria-label="From year"
        @change="set({ yearFrom: selected($event) })"
      >
        <option value="">From any year</option>
        <option v-for="y in years" :key="y" :value="y">From {{ y }}</option>
      </select>
      <select
        :value="filters.yearTo ?? ''"
        aria-label="To year"
        @change="set({ yearTo: selected($event) })"
      >
        <option value="">To any year</option>
        <option v-for="y in years" :key="y" :value="y">To {{ y }}</option>
      </select>
      <button
        v-if="filters.yearFrom || filters.yearTo"
        type="button"
        class="plain small clear-one"
        aria-label="Clear years"
        @click="set({ yearFrom: null, yearTo: null })"
      >
        <AppIcon name="close" :size="12" />
      </button>
    </div>

    <div class="field">
      <select
        :value="filters.genre ?? ''"
        aria-label="Filter by genre"
        @change="set({ genre: selected($event) })"
      >
        <option value="">Any genre</option>
        <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <button
        v-if="filters.genre"
        type="button"
        class="plain small clear-one"
        aria-label="Clear genre"
        @click="set({ genre: null })"
      >
        <AppIcon name="close" :size="12" />
      </button>
    </div>

    <select
      v-if="active"
      :value="filters.sort"
      aria-label="Order films by"
      @change="set({ sort: ($event.target as HTMLSelectElement).value as Sort })"
    >
      <option v-for="s in SORTS" :key="s.value" :value="s.value">{{ s.label }}</option>
    </select>

    <div class="actions">
      <button
        type="button"
        class="small"
        :class="filters.hideSeen ? 'mustard' : 'plain'"
        :aria-pressed="filters.hideSeen"
        @click="set({ hideSeen: !filters.hideSeen })"
      >
        <AppIcon :name="filters.hideSeen ? 'eye-off' : 'eye'" :size="14" />
        {{ filters.hideSeen ? 'Hiding films in my library' : 'Hide films in my library' }}
      </button>
      <button v-if="active" type="button" class="plain small" @click="clearAll">
        <AppIcon name="close" :size="12" /> Clear filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.person,
.years,
.actions {
  grid-column: 1 / -1;
}

.person {
  position: relative;
}

.person {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.person input {
  width: 100%;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.roles button {
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
}

.field {
  display: flex;
  gap: 0.4rem;
  min-width: 0;
}

.field select {
  flex: 1;
  min-width: 0;
}

.clear-one {
  flex: none;
  padding-inline: 0.6rem;
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 900px) {
  .filters {
    grid-template-columns: 2fr 2fr 1fr 1fr;
    align-items: center;
  }

  .person,
  .years {
    grid-column: auto;
  }

  /* With role buttons, the person gets the whole row so they fit on one line. */
  .person:has(.roles) {
    grid-column: 1 / -1;
  }
}
</style>
