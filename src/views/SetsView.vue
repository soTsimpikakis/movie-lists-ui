<script setup lang="ts">
import { computed, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import LoadError from '@/components/LoadError.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { goldCount, shelves } from '@/lib/sets'
import { useSetsStore } from '@/stores/sets'

// The Sets page is a grid of shelves (Franchises, Directors, Awards), each opening its own
// page. Sets live in a store, so coming back shows them at once.
const store = useSetsStore()
/** A tile per shelf: its sets done, and what's on it (groups by name, then lone sets). */
const grid = computed(() =>
  shelves(store.sets ?? []).map((shelf) => {
    const names = [...shelf.groups.map((g) => g.title), ...shelf.standalone.map((s) => s.title)]
    return {
      kind: shelf.kind,
      title: shelf.title,
      total: shelf.sets.length,
      gold: goldCount(shelf.sets),
      names: names.slice(0, 4),
      more: Math.max(0, names.length - 4),
    }
  }),
)

onMounted(() => store.load())
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <LoadError
      v-if="store.sets === null && store.error"
      :message="store.error"
      @retry="store.load()"
    />
    <p v-else-if="store.sets === null" class="muted">Loading…</p>
    <p v-else-if="!store.sets.length" class="muted">No sets yet.</p>
    <ul v-else class="shelves">
      <li v-for="shelf in grid" :key="shelf.kind">
        <RouterLink
          class="shelf parchment-card"
          :class="shelf.kind"
          :to="{ name: 'shelf', params: { kind: shelf.kind } }"
          :aria-label="`${shelf.title}: ${shelf.gold} of ${shelf.total} sets done`"
        >
          <span class="band" aria-hidden="true">{{ shelf.title }}</span>
          <span class="body">
            <span class="count">
              <span class="big">{{ shelf.gold }}</span>
              <span class="of">of {{ shelf.total }} sets done</span>
            </span>
            <TicketProgress class="bar" :watched="shelf.gold" :total="shelf.total" strip />
            <span class="names">
              <span v-for="name in shelf.names" :key="name" class="name">
                {{ name }}
              </span>
              <span v-if="shelf.more" class="name more"> +{{ shelf.more }} more </span>
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.shelves {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1.25rem;
}

/* A shelf as a big parchment ticket: a coloured band with its name, the sets done, and what
   it holds. */
.shelf {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0.8rem;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s;
  --hole-on: var(--red);
  --hole-off: var(--parchment-muted);
}

.shelf:active {
  transform: translateY(2px);
}

.band {
  padding: 0.75rem 1rem;
  border-bottom: 2px dashed var(--ticket-line);
  border-radius: calc(0.8rem - 2px) calc(0.8rem - 2px) 0 0;
  background: var(--red);
  color: var(--on-red);
  font-family: var(--ticket-title);
  font-size: 1.4rem;
  font-weight: 700;
}

.awards .band {
  background: var(--mustard);
  color: var(--on-mustard);
}

.director .band {
  background: var(--parchment-ink);
  color: var(--parchment);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem 1rem;
}

.count {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.count .big {
  font-family: var(--ticket-title);
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
}

.count .of,
.name {
  font-family: var(--ticket-type);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.bar {
  height: 0.6rem;
}

.names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.name {
  padding: 0.1rem 0.5rem;
  border: 1.5px solid var(--parchment-muted);
  border-radius: 999px;
  color: var(--parchment-muted);
}

.name.more {
  border-style: dashed;
}
</style>
