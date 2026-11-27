<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { AdminMission, EggStatus } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import { seasonText } from '@/lib/missions'

// Missions in the admin view (design.md §6.6): the same pattern as eggs. Drafts are as easy to
// find as live ones.
const missions = ref<AdminMission[] | null>(null)
const error = ref('')
const filter = ref<EggStatus | 'all'>('all')
const FILTERS: { value: EggStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'live', label: 'Live' },
  { value: 'off', label: 'Off' },
]
const count = (value: EggStatus | 'all') =>
  (missions.value ?? []).filter((m) => value === 'all' || m.status === value).length
const shown = computed(() =>
  (missions.value ?? []).filter((m) => filter.value === 'all' || m.status === filter.value),
)

function goal(m: AdminMission): string {
  const g = m.goal
  const listed = m.set_id ? 'a set' : `${g.films?.length ?? 0} films`
  if (g.kind === 'count_matching') return `${g.count} × ${g.genre ?? `keyword ${g.keyword}`}`
  if (g.kind === 'all_of_list') return `All of ${listed}`
  return `${g.count} of ${listed}`
}

onMounted(async () => {
  try {
    missions.value = await api<AdminMission[]>('/admin/missions')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<template>
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
    <RouterLink class="button-link small" :to="{ name: 'admin-mission-new' }">
      <AppIcon name="plus" :size="14" /> New mission
    </RouterLink>
  </div>

  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="missions === null" class="muted">Loading…</p>
  <p v-else-if="!shown.length" class="muted">No missions here yet.</p>
  <ul v-else class="items">
    <li v-for="m in shown" :key="m.id">
      <RouterLink class="item" :to="{ name: 'admin-mission', params: { id: m.id } }">
        <span class="main">
          <span class="title">{{ m.title }}</span>
          <span class="what">
            {{ seasonText(m.season_start ?? m.starts_on, m.season_end ?? m.ends_on) }}
            <template v-if="m.repeats_yearly"> · every year</template> · {{ goal(m) }}
          </span>
          <span class="description">{{ m.description }}</span>
        </span>
        <span class="side">
          <span class="pill" :class="m.status">{{ m.status }}</span>
          <span class="muted small-text">{{ m.joined }} in · done {{ m.finished }}×</span>
        </span>
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.n {
  font-family: var(--mono);
  font-size: 0.75rem;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.item {
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

.item:hover {
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
  .items {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
