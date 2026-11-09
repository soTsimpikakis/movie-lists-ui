<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SetSummary } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'

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
        <RouterLink class="set" :to="{ name: 'set', params: { id: s.id } }">
          <span class="set-title">
            {{ s.title }}
            <span v-if="s.kind === 'director'" class="muted kind">director</span>
          </span>
          <span class="progress-text" :class="{ done: s.watched === s.total }">
            <template v-if="s.watched === s.total">Complete ✓</template>
            <template v-else>{{ s.watched }} of {{ s.total }}</template>
          </span>
          <span class="bar" aria-hidden="true">
            <span class="fill" :style="{ width: `${(100 * s.watched) / s.total}%` }" />
          </span>
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
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  color: inherit;
  text-decoration: none;
}

.set-title {
  font-weight: 600;
}

.kind {
  font-weight: 400;
  font-size: 0.8rem;
  margin-left: 0.25rem;
}

.progress-text {
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.progress-text.done {
  color: var(--accent);
  font-weight: 600;
}

.bar {
  grid-column: 1 / -1;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
}
</style>
