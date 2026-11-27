<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { MonthCount, SearchResult, Watch, WatchPage } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FindFilmDialog from '@/components/FindFilmDialog.vue'
import LogSheet from '@/components/LogSheet.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import WatchTicket from '@/components/WatchTicket.vue'
import { toDiary } from '@/lib/diary'
import { useReactionsStore } from '@/stores/reactions'

const reactions = useReactionsStore()

// Logging starts in the Find a film dialog (title search plus filters). Picking a film opens
// the log sheet on top; cancelling it goes back to the dialog as it was.
const finding = ref(false)
const finder = ref<InstanceType<typeof FindFilmDialog>>()

const PAGE = 20
const watches = ref<Watch[] | null>(null)
const nextOffset = ref<number | null>(null)
const totals = ref({ dated: 0, undated: 0 })
const months = ref<MonthCount[]>([])
const loadingMore = ref(false)
const picked = ref<SearchResult | null>(null)
const toast = ref('')

// The diary: dated watches under year and month headings. Films ticked off in "Movies I've
// seen" have no date and live in the Library instead.
const diary = computed(() => toDiary(watches.value ?? [], months.value))

/** Newest watch date first, a page at a time; `more` appends the next page for "Load more". */
async function loadWatches(more = false) {
  const offset = more ? (nextOffset.value ?? 0) : 0
  const page = await api<WatchPage>(`/watches?offset=${offset}&limit=${PAGE}`)
  watches.value = more ? [...(watches.value ?? []), ...page.items] : page.items
  nextOffset.value = page.next_offset
  totals.value = { dated: page.dated_total, undated: page.undated_total }
  months.value = page.months
}

async function loadMore() {
  loadingMore.value = true
  try {
    await loadWatches(true)
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  loadWatches()
  reactions.load()
})

async function onLogged(logged: Watch) {
  picked.value = null
  finding.value = false
  finder.value?.markLogged(logged.film.tmdb_id)
  toast.value = logged.watched_on
    ? `Logged ${logged.film.title}`
    : `Added ${logged.film.title} to your library`
  setTimeout(() => (toast.value = ''), 2500)
  await loadWatches()
}
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <!-- Looks like a search box; opens the Find a film dialog. -->
    <button type="button" class="find" aria-haspopup="dialog" @click="finding = true">
      <AppIcon name="search" :size="18" />
      <span>Log a film…</span>
    </button>

    <section>
      <p v-if="watches === null" class="muted">Loading…</p>
      <div v-else-if="!watches.length && !totals.undated" class="empty">
        <p class="muted">Nothing logged yet. Search for the last film you watched, or</p>
        <RouterLink :to="{ name: 'seen' }" class="button-link mustard">
          <AppIcon name="check" /> Tick off films you've already seen
        </RouterLink>
      </div>
      <div v-else-if="!watches.length" class="empty">
        <p class="muted">
          Your diary starts with the next film you log. The {{ totals.undated }} films you saw
          before joining are in your Library.
        </p>
        <RouterLink :to="{ name: 'library' }" class="button-link mustard">
          <AppIcon name="library" /> Open my Library
        </RouterLink>
      </div>
      <template v-else>
        <h2 class="list-heading">
          Watched <span class="count">· {{ totals.dated }}</span>
        </h2>

        <section v-for="year in diary" :key="year.year" class="year">
          <h3 class="year-heading">
            {{ year.year }}
            <span class="tally">{{ year.count }} {{ year.count === 1 ? 'film' : 'films' }}</span>
          </h3>
          <template v-for="month in year.months" :key="month.key">
            <h4 class="month-heading">
              {{ month.name }} <span class="tally">· {{ month.count }}</span>
            </h4>
            <ul class="watches">
              <li v-for="w in month.items" :key="w.id">
                <WatchTicket :watch="w" />
              </li>
            </ul>
          </template>
        </section>
        <button
          v-if="nextOffset !== null"
          class="plain load-more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <AppIcon name="chevron-down" /> {{ loadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </template>
    </section>

    <TmdbCredit />

    <FindFilmDialog ref="finder" :open="finding" @pick="picked = $event" @close="finding = false" />
    <LogSheet v-if="picked" :film="picked" @logged="onLogged" @close="picked = null" />
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </main>
</template>

<style scoped>
/* Dressed as the search box it opens (SearchField), so it reads as "type here". */
.find {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  margin-bottom: 1.25rem;
  padding: 0.75rem 0.85rem;
  border: 2px dashed var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  color: var(--faint);
  font: inherit;
  text-align: left;
  box-shadow: none;
  cursor: text;
}

.find:focus-visible {
  border-style: solid;
  outline: 3px solid var(--mustard);
  outline-offset: 1px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.empty p {
  margin-bottom: 0.75rem;
}

.list-heading {
  font-size: 1.15rem;
  margin: 0 0 0.9rem;
}

.count {
  color: var(--red);
}

/* Diary headings: the year as a slab title over a red rule, months typed like a ledger. */
.year + .year {
  margin-top: 2rem;
}

.year-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 0.25rem;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid var(--red);
  font-family: var(--ticket-title);
  font-size: 1.6rem;
}

.month-heading {
  margin: 1.1rem 0 0.7rem;
  font-family: var(--ticket-type);
  font-size: 1rem;
  font-weight: normal;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tally {
  font-family: var(--ticket-type);
  font-size: 0.85rem;
  font-weight: normal;
  color: var(--muted);
  text-transform: none;
}

.watches {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Tickets lie on the page: a shadow that follows the notch, and a slight, varying tilt. */
.watches li {
  filter: var(--ticket-shadow);
}

.watches li:nth-child(3n + 1) {
  transform: rotate(-0.5deg);
}

.watches li:nth-child(3n + 2) {
  transform: rotate(0.4deg) translateX(2px);
}

.watches li:nth-child(3n) {
  transform: rotate(-0.15deg) translateX(-1px);
}

@media (min-width: 900px) {
  .watches {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.1rem 1.5rem;
  }
}

.load-more {
  width: 100%;
  margin-top: 1.25rem;
}
</style>
