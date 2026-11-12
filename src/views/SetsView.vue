<script setup lang="ts">
import { computed, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import SetPile from '@/components/SetPile.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { byDecade, groupSets } from '@/lib/sets'
import { useSetsStore } from '@/stores/sets'

// Sets live in a store, so coming back here shows them at once (and back restores the
// scroll); the many Best Picture years show one decade at a time to keep the page light.
const store = useSetsStore()
const groups = computed(() => groupSets(store.sets ?? []))
const hasAwards = computed(
  () => Boolean(groups.value.allWinners) || groups.value.ceremonies.length > 0,
)
const done = (sets: { trophy: string | null }[]) => sets.filter((s) => s.trophy === 'gold').length

const decades = computed(() => byDecade(groups.value.ceremonies))
// The latest decade until the user picks another; the store remembers the pick.
const decade = computed({
  get: () => store.ceremonyDecade ?? [...decades.value.keys()].at(-1) ?? null,
  set: (value) => (store.ceremonyDecade = value),
})
const shownCeremonies = computed(() =>
  decade.value === null ? [] : (decades.value.get(decade.value) ?? []),
)

const awardSets = computed(() => [
  ...(groups.value.allWinners ? [groups.value.allWinners] : []),
  ...groups.value.decades.map((t) => t.set),
  ...groups.value.ceremonies.map((t) => t.set),
])

onMounted(() => store.load())
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <p v-if="store.sets === null" class="muted">Loading…</p>
    <p v-else-if="!store.sets.length" class="muted">No sets yet.</p>
    <template v-else>
      <h2 v-if="hasAwards" class="group">Franchises &amp; directors</h2>
      <ul class="sets">
        <li v-for="(s, i) in groups.piles" :key="s.id">
          <SetPile :set="s" :flip="i % 2 === 1" />
        </li>
      </ul>

      <template v-if="hasAwards">
        <h2 class="group">
          Best Picture
          <span class="tally">{{ done(awardSets) }} of {{ awardSets.length }} sets done</span>
        </h2>
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
        <div class="decade-tabs" role="group" aria-label="Decade of the ceremonies">
          <button
            v-for="[d, tiles] in decades"
            :key="d"
            type="button"
            class="small"
            :class="d === decade ? 'mustard' : 'plain'"
            :aria-pressed="d === decade"
            @click="decade = d"
          >
            {{ d }}s
            <span v-if="done(tiles.map((t) => t.set))" class="tab-done">
              {{ done(tiles.map((t) => t.set)) }}✓
            </span>
          </button>
        </div>
        <ul class="stubs">
          <li v-for="t in shownCeremonies" :key="t.set.id">
            <RouterLink
              class="stub-tile"
              :class="t.set.trophy"
              :to="{ name: 'set', params: { id: t.set.id } }"
              :aria-label="`${t.set.title}: ${t.set.watched} of ${t.set.total} watched`"
            >
              <span class="big">{{ t.big }}</span>
              <span class="nth">{{ t.small }}</span>
              <span class="count">{{ t.set.watched }}/{{ t.set.total }}</span>
              <TicketProgress class="bar" :watched="t.set.watched" :total="t.set.total" strip />
            </RouterLink>
          </li>
        </ul>
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
  /* A plain box shadow: a drop-shadow filter on dozens of tiles is slow to scroll. */
  box-shadow: 0 1px 1px rgb(42 26 18 / 0.18);
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

.stub-tile .nth,
.stub-tile .count {
  font-family: var(--ticket-type);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--parchment-muted);
}

.stub-tile .nth {
  white-space: nowrap;
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
  box-shadow:
    inset 0 0 0 2px var(--mustard),
    0 1px 1px rgb(42 26 18 / 0.18);
  --hole-on: var(--mustard);
}

.stub-tile.silver {
  box-shadow:
    inset 0 0 0 2px #c3c7cc,
    0 1px 1px rgb(42 26 18 / 0.18);
}

.tally {
  margin-left: 0.5rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--muted);
}

/* One decade of ceremonies at a time; the row scrolls sideways on a phone. */
.decade-tabs {
  display: flex;
  gap: 0.4rem;
  margin: 0 -1rem 0.9rem;
  padding: 0.2rem 1rem 0.5rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.decade-tabs button {
  flex: none;
}

.tab-done {
  font-family: var(--mono);
  font-size: 0.7rem;
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
