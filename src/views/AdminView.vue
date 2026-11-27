<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/api/client'
import type { AdminEgg, EggStatus, Genre } from '@/api/types'
import AdminMaintenance from '@/components/AdminMaintenance.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import { formatDate } from '@/lib/format'
import { matchText, whenText } from '@/lib/eggs'

// The admin view (design.md §6.6): laptop-first and plain. Easter eggs (drafts are as easy to
// find as live ones, so parked ideas don't get lost) and Maintenance. Missions join in 7C.
const route = useRoute()
const maintenance = computed(() => route.name === 'admin-maintenance')

const eggs = ref<AdminEgg[] | null>(null)
const genres = ref<Genre[]>([])
const error = ref('')
const filter = ref<EggStatus | 'all'>('all')
const FILTERS: { value: EggStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'live', label: 'Live' },
  { value: 'off', label: 'Off' },
]
const count = (value: EggStatus | 'all') =>
  (eggs.value ?? []).filter((e) => value === 'all' || e.status === value).length
const shown = computed(() =>
  (eggs.value ?? []).filter((e) => filter.value === 'all' || e.status === filter.value),
)

onMounted(async () => {
  try {
    ;[eggs.value, genres.value] = await Promise.all([
      api<AdminEgg[]>('/admin/eggs'),
      api<Genre[]>('/genres'),
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <div class="heading">
      <h2>Admin</h2>
      <nav class="tabs" aria-label="Admin sections">
        <RouterLink
          class="button-link small"
          :class="maintenance ? 'plain' : 'mustard'"
          :to="{ name: 'admin' }"
          :aria-current="maintenance ? undefined : 'page'"
        >
          <AppIcon name="egg" :size="14" /> Easter eggs
        </RouterLink>
        <RouterLink
          class="button-link small"
          :class="maintenance ? 'mustard' : 'plain'"
          :to="{ name: 'admin-maintenance' }"
          :aria-current="maintenance ? 'page' : undefined"
        >
          <AppIcon name="sparkle" :size="14" /> Maintenance
        </RouterLink>
      </nav>
    </div>

    <AdminMaintenance v-if="maintenance" />

    <template v-else>
      <div class="bar">
        <div class="filters" role="group" aria-label="Show">
          <button
            v-for="f in FILTERS"
            :key="f.value"
            type="button"
            class="small"
            :class="filter === f.value ? 'mustard' : 'plain'"
            :aria-pressed="filter === f.value"
            @click="filter = f.value"
          >
            {{ f.label }} <span class="n">{{ count(f.value) }}</span>
          </button>
        </div>
        <RouterLink class="button-link small" :to="{ name: 'admin-egg-new' }">
          <AppIcon name="plus" :size="14" /> New egg
        </RouterLink>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-else-if="eggs === null" class="muted">Loading…</p>
      <p v-else-if="!shown.length" class="muted">
        {{ filter === 'draft' ? 'No drafts. Every idea is out there.' : 'No eggs here yet.' }}
      </p>
      <ul v-else class="eggs">
        <li v-for="e in shown" :key="e.id">
          <RouterLink class="egg" :to="{ name: 'admin-egg', params: { id: e.id } }">
            <span class="main">
              <span class="title">{{ e.title }}</span>
              <span class="what">{{ whenText(e) }} · {{ matchText(e, genres) }}</span>
              <span v-if="e.lore" class="lore">{{ e.lore }}</span>
              <span v-else class="lore missing">No lore line yet</span>
            </span>
            <span class="side">
              <span class="pill" :class="e.status">{{ e.status }}</span>
              <span class="muted small-text">found {{ e.found }}×</span>
              <span v-if="e.next_on" class="muted small-text">
                next {{ formatDate(e.next_on) }}
              </span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </template>
  </main>
</template>

<style scoped>
.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.heading h2 {
  margin: 0;
}

.tabs,
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.n {
  font-family: var(--mono);
  font-size: 0.75rem;
}

.eggs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.egg {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  color: inherit;
  text-decoration: none;
}

.egg:hover {
  border-color: var(--mustard);
}

.main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.title {
  font-weight: 700;
}

.what {
  font-family: var(--mono);
  font-size: 0.8rem;
}

.lore {
  font-style: italic;
}

.lore.missing {
  font-style: normal;
  color: var(--muted);
}

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex: none;
}

.pill {
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  border: 2px solid var(--line);
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pill.live {
  background: var(--mustard);
  color: var(--on-mustard);
  border-color: var(--mustard);
}

.pill.off {
  color: var(--muted);
}

.small-text {
  font-size: 0.8rem;
}

@media (min-width: 900px) {
  .eggs {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
