<script setup lang="ts" generic="T extends { id: number; status: PublishStatus }">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { PublishStatus } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import StatusPill from '@/components/StatusPill.vue'

// A list in the admin view (eggs, missions): filter by status with counts, a "New" button,
// and a row per item linking to its page. Drafts are as easy to find as live ones, so parked
// ideas don't get lost. The rows' text comes from the `main` and `side` slots.
type Filter = PublishStatus | 'all'

const props = defineProps<{
  /** Null while loading. */
  items: T[] | null
  error: string
  newLabel: string
  newTo: RouteLocationRaw
  to: (item: T) => RouteLocationRaw
  /** What to say when the filter shows nothing. */
  empty: (filter: Filter) => string
}>()
defineSlots<{
  main(props: { item: T }): unknown
  side(props: { item: T }): unknown
}>()

const filter = ref<Filter>('all')
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'live', label: 'Live' },
  { value: 'off', label: 'Off' },
]
const matching = (value: Filter) =>
  (props.items ?? []).filter((item) => value === 'all' || item.status === value)
const shown = computed(() => matching(filter.value))
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
        {{ f.label }} <span class="n">{{ matching(f.value).length }}</span>
      </button>
    </div>
    <RouterLink class="button-link small" :to="newTo">
      <AppIcon name="plus" :size="14" /> {{ newLabel }}
    </RouterLink>
  </div>

  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="items === null" class="muted">Loading…</p>
  <p v-else-if="!shown.length" class="muted">{{ empty(filter) }}</p>
  <ul v-else class="items">
    <li v-for="item in shown" :key="item.id">
      <RouterLink class="item" :to="to(item)">
        <span class="main">
          <slot name="main" :item="item" />
        </span>
        <span class="side">
          <StatusPill :status="item.status" />
          <slot name="side" :item="item" />
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

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex: none;
}

/* The rows' text, shared by every list. */
:slotted(.title) {
  font-weight: 700;
}

:slotted(.what) {
  font-family: var(--mono);
  font-size: 0.8rem;
}

:slotted(.small-text) {
  font-size: 0.8rem;
}

@media (min-width: 900px) {
  .items {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
