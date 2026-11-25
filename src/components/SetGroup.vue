<script setup lang="ts">
import SetPile from '@/components/SetPile.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { byDecade, goldCount, type Group, type Section, tileLabel } from '@/lib/sets'
import { useSetsStore } from '@/stores/sets'

// A group of sets on its shelf (Best Picture, the MCU): the lead set as a pile, then each
// section's sets as small ticket stubs. A long section of years shows a decade at a time.
const props = defineProps<{ group: Group; heading?: boolean }>()
const store = useSetsStore()

const decadesOf = (section: Section) => byDecade(section)
const stateKey = (section: Section) => `${props.group.key}/${section.name}`

/** The decade shown for a section of years: the latest until the user picks another. */
function shownDecade(section: Section, decades: Map<number, unknown>): number | undefined {
  const all = [...decades.keys()]
  return store.decades[stateKey(section)] ?? all[all.length - 1]
}

function shown(section: Section) {
  const decades = decadesOf(section)
  if (!decades) return section.sets
  return decades.get(shownDecade(section, decades) ?? NaN) ?? []
}
</script>

<template>
  <section class="set-group" :aria-label="group.title">
    <h3 v-if="heading" class="group-title">
      {{ group.title }}
      <span class="tally">{{ goldCount(group.sets) }} of {{ group.sets.length }} sets done</span>
    </h3>
    <ul v-if="group.lead" class="piles">
      <li><SetPile :set="group.lead" /></li>
    </ul>

    <template v-for="section in group.sections" :key="section.name">
      <h4 class="sub">{{ section.name }}</h4>
      <div
        v-if="decadesOf(section)"
        class="decade-tabs"
        role="group"
        :aria-label="`${section.name}: decade`"
      >
        <button
          v-for="[d, sets] in decadesOf(section)!"
          :key="d"
          type="button"
          class="small"
          :class="d === shownDecade(section, decadesOf(section)!) ? 'mustard' : 'plain'"
          :aria-pressed="d === shownDecade(section, decadesOf(section)!)"
          @click="store.decades[stateKey(section)] = d"
        >
          {{ d }}s
          <span v-if="goldCount(sets)" class="tab-done">{{ goldCount(sets) }}✓</span>
        </button>
      </div>
      <ul class="stubs">
        <li v-for="s in shown(section)" :key="s.id">
          <RouterLink
            class="stub-tile"
            :class="s.trophy"
            :to="{ name: 'set', params: { id: s.id } }"
            :aria-label="`${s.title}: ${s.watched} of ${s.total} watched`"
          >
            <span class="big">{{ tileLabel(s) }}</span>
            <span v-if="s.sublabel" class="nth">{{ s.sublabel }}</span>
            <span class="count">{{ s.watched }}/{{ s.total }}</span>
            <TicketProgress class="bar" :watched="s.watched" :total="s.total" strip />
          </RouterLink>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.group-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.tally {
  margin-left: 0.5rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.piles {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0.4rem;
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

/* Small ticket stubs for the many sets of a group: label, count and a thin strip. */
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

/* One decade at a time; the row scrolls sideways on a phone. */
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
  .piles {
    max-width: calc(50% - 0.9rem);
  }

  .stubs {
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  }
}
</style>
