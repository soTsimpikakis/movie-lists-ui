<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/AppHeader.vue'
import LoadError from '@/components/LoadError.vue'
import AppIcon from '@/components/AppIcon.vue'
import SetGroup from '@/components/SetGroup.vue'
import SetPile from '@/components/SetPile.vue'
import { goldCount, shelves } from '@/lib/sets'
import { useSetsStore } from '@/stores/sets'

// One shelf of the Sets page: its lone sets as piles, then its groups. A shelf of nothing
// but groups (Awards: Best Picture, International Feature…) shows one group at a time.
const route = useRoute()
const store = useSetsStore()
const shelf = computed(
  () => shelves(store.sets ?? []).find((s) => s.kind === route.params.kind) ?? null,
)
const tabbed = computed(() =>
  Boolean(shelf.value && shelf.value.groups.length > 1 && !shelf.value.standalone.length),
)
const tab = computed({
  get: () => {
    const groups = shelf.value?.groups ?? []
    const picked = store.tabs[String(route.params.kind)]
    return groups.find((g) => g.key === picked) ?? groups[0] ?? null
  },
  set: (group) => {
    if (group) store.tabs[String(route.params.kind)] = group.key
  },
})

onMounted(() => store.load())
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <RouterLink class="button-link plain small back" :to="{ name: 'sets' }">
      <AppIcon name="back" :size="14" /> All sets
    </RouterLink>

    <LoadError
      v-if="store.sets === null && store.error"
      :message="store.error"
      @retry="store.load()"
    />
    <p v-else-if="store.sets === null" class="muted">Loading…</p>
    <p v-else-if="!shelf" class="muted">There are no sets here.</p>
    <template v-else>
      <h2 class="title">
        {{ shelf.title }}
        <span class="tally">{{ goldCount(shelf.sets) }} of {{ shelf.sets.length }} sets done</span>
      </h2>

      <template v-if="tabbed && tab">
        <div class="group-tabs" role="group" :aria-label="shelf.title">
          <button
            v-for="g in shelf.groups"
            :key="g.key"
            type="button"
            :class="g.key === tab.key ? 'mustard' : 'plain'"
            :aria-pressed="g.key === tab.key"
            @click="tab = g"
          >
            {{ g.title }}
            <span class="tab-done">{{ goldCount(g.sets) }}/{{ g.sets.length }}</span>
          </button>
        </div>
        <SetGroup :key="tab.key" :group="tab" />
      </template>

      <template v-else>
        <ul v-if="shelf.standalone.length" class="piles">
          <li v-for="(s, i) in shelf.standalone" :key="s.id">
            <SetPile :set="s" :flip="i % 2 === 1" />
          </li>
        </ul>
        <SetGroup v-for="g in shelf.groups" :key="g.key" class="group" :group="g" heading />
      </template>
    </template>
  </main>
</template>

<style scoped>
.back {
  margin-bottom: 0.9rem;
}

.title {
  margin: 0 0 1.1rem;
  font-size: 1.4rem;
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
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.group {
  margin-top: 2.25rem;
}

/* Groups on a shelf of groups: a row of tabs that scrolls sideways on a phone. */
.group-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 0 -1rem 1.25rem;
  padding: 0.2rem 1rem 0.5rem;
  overflow-x: auto;
}

.group-tabs button {
  flex: none;
}

.tab-done {
  font-family: var(--mono);
  font-size: 0.7rem;
}

@media (min-width: 900px) {
  .piles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.6rem 1.75rem;
  }
}
</style>
