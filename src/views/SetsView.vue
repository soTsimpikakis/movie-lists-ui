<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { SetSummary } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import SetPile from '@/components/SetPile.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { groupSets } from '@/lib/sets'

const sets = ref<SetSummary[] | null>(null)
const groups = computed(() => groupSets(sets.value ?? []))
const hasAwards = computed(
  () => Boolean(groups.value.allWinners) || groups.value.ceremonies.length > 0,
)

// A hundred-odd ceremonies is a long scroll; the latest few show until asked for the rest.
const RECENT_CEREMONIES = 12
const allCeremonies = ref(false)
const shownCeremonies = computed(() =>
  allCeremonies.value
    ? groups.value.ceremonies
    : groups.value.ceremonies.slice(0, RECENT_CEREMONIES),
)

onMounted(async () => {
  sets.value = await api<SetSummary[]>('/sets')
})
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <p v-if="sets === null" class="muted">Loading…</p>
    <p v-else-if="!sets.length" class="muted">No sets yet.</p>
    <template v-else>
      <h2 v-if="hasAwards" class="group">Franchises &amp; directors</h2>
      <ul class="sets">
        <li v-for="(s, i) in groups.piles" :key="s.id">
          <SetPile :set="s" :flip="i % 2 === 1" />
        </li>
      </ul>

      <template v-if="hasAwards">
        <h2 class="group">Best Picture</h2>
        <ul v-if="groups.allWinners" class="sets">
          <li><SetPile :set="groups.allWinners" /></li>
        </ul>

        <h3 v-if="groups.decades.length" class="sub">Winners by decade</h3>
        <ul class="stubs decades">
          <li v-for="t in groups.decades" :key="t.set.id">
            <RouterLink
              class="stub-tile"
              :class="t.set.trophy"
              :to="{ name: 'set', params: { id: t.set.id } }"
            >
              <span class="big">{{ t.big }}</span>
              <span class="count">{{ t.set.watched }}/{{ t.set.total }}</span>
              <TicketProgress class="bar" :watched="t.set.watched" :total="t.set.total" strip />
            </RouterLink>
          </li>
        </ul>

        <h3 v-if="groups.ceremonies.length" class="sub">Nominees by year</h3>
        <ul class="stubs">
          <li v-for="t in shownCeremonies" :key="t.set.id">
            <RouterLink
              class="stub-tile"
              :class="t.set.trophy"
              :to="{ name: 'set', params: { id: t.set.id } }"
              :aria-label="`${t.set.title}: ${t.set.watched} of ${t.set.total} watched`"
            >
              <span class="big">{{ t.big }}</span>
              <span class="small">{{ t.small }}</span>
              <span class="count">{{ t.set.watched }}/{{ t.set.total }}</span>
              <TicketProgress class="bar" :watched="t.set.watched" :total="t.set.total" strip />
            </RouterLink>
          </li>
        </ul>
        <button
          v-if="groups.ceremonies.length > RECENT_CEREMONIES"
          class="plain more"
          :aria-expanded="allCeremonies"
          @click="allCeremonies = !allCeremonies"
        >
          <AppIcon :name="allCeremonies ? 'chevron-up' : 'chevron-down'" />
          {{ allCeremonies ? 'Show fewer' : `Show all ${groups.ceremonies.length} years` }}
        </button>
      </template>
    </template>
  </main>
</template>

<style scoped>
.sets {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.group {
  margin: 1.75rem 0 1rem;
  font-size: 1.1rem;
}

.group:first-of-type {
  margin-top: 0.5rem;
}

.sub {
  margin: 1.75rem 0 0.75rem;
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

/* Small ticket stubs for the many Best Picture sets: year, count and a thin strip. */
.stubs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.75rem;
}

.stub-tile {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  height: 100%;
  padding: 0.6rem 0.65rem 0.65rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.5rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  text-decoration: none;
  filter: var(--ticket-shadow);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s;
  --hole-on: var(--red);
  --hole-off: var(--parchment-muted);
}

.stub-tile:active {
  transform: translateY(2px);
}

.stub-tile .big {
  font-family: var(--ticket-title);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.1;
}

.stub-tile .small,
.stub-tile .count {
  font-family: var(--ticket-type);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--parchment-muted);
}

.stub-tile .count {
  margin-top: auto;
  padding-top: 0.3rem;
  color: var(--parchment-ink);
}

.stub-tile .bar {
  margin-top: 0.15rem;
  height: 0.55rem;
  border-width: 1.5px;
}

/* Trophies, as on the piles: gold when every film is watched, silver once a film joined. */
.stub-tile.gold {
  border-color: var(--mustard);
  box-shadow: inset 0 0 0 2px var(--mustard);
  --hole-on: var(--mustard);
}

.stub-tile.silver {
  box-shadow: inset 0 0 0 2px #c3c7cc;
}

.more {
  width: 100%;
  margin-top: 1rem;
}

@media (min-width: 900px) {
  .sets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.6rem 1.75rem;
  }

  .stubs {
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  }
}
</style>
