<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SetSummary } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import TicketProgress from '@/components/TicketProgress.vue'

const sets = ref<SetSummary[] | null>(null)

onMounted(async () => {
  sets.value = await api<SetSummary[]>('/sets')
})
</script>

<template>
  <main class="page">
    <AppHeader />

    <p v-if="sets === null" class="muted">Loading…</p>
    <p v-else-if="!sets.length" class="muted">No sets yet.</p>
    <ul v-else class="sets">
      <li v-for="s in sets" :key="s.id">
        <RouterLink
          class="set"
          :class="{ done: s.watched === s.total }"
          :to="{ name: 'set', params: { id: s.id } }"
        >
          <span class="set-title">
            {{ s.title }}
            <span v-if="s.kind === 'director'" class="kind">director</span>
          </span>
          <span class="progress-text">
            <template v-if="s.watched === s.total">Complete ✓</template>
            <template v-else>{{ s.watched }} of {{ s.total }}</template>
          </span>
          <TicketProgress class="holes" :watched="s.watched" :total="s.total" />
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.sets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.set {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border: 2px solid var(--line);
  border-radius: 0.75rem;
  background: var(--card);
  box-shadow: 0 3px 0 var(--edge);
  color: inherit;
  text-decoration: none;
}

/* Completed sets flip to the dark ticket with gold holes. */
.set.done {
  background: var(--fg);
  color: var(--bg);
  --hole-on: var(--mustard);
}

.set-title {
  font-family: var(--display);
  font-size: 1.05rem;
}

.kind {
  margin-left: 0.3rem;
  padding: 0.05rem 0.4rem;
  border: 1.5px solid currentColor;
  border-radius: 0.3rem;
  font-family: var(--mono);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  vertical-align: middle;
  opacity: 0.75;
}

.progress-text {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--red);
  white-space: nowrap;
}

.done .progress-text {
  color: var(--mustard);
}

.holes {
  grid-column: 1 / -1;
}
</style>
