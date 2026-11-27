<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { api, ApiError, errorText } from '@/api/client'
import type { SearchResult, SetDetail, SetFilm, Watch } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import LoadError from '@/components/LoadError.vue'
import AppIcon from '@/components/AppIcon.vue'
import BulkProgress from '@/components/BulkProgress.vue'
import FilmTile from '@/components/FilmTile.vue'
import LogSheet from '@/components/LogSheet.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { PartialSaveError, saveSeen } from '@/lib/bulk'
import { formatDate } from '@/lib/format'
import { neighbours, SHELF_TITLES } from '@/lib/sets'
import { useRewardsStore } from '@/stores/rewards'
import { useSetsStore } from '@/stores/sets'

const route = useRoute()
const rewards = useRewardsStore()
const sets = useSetsStore()
const id = computed(() => Number(route.params.id))
// Previous and next set in the same series (Best Picture years, franchises...).
const nav = computed(() => (sets.sets ? neighbours(sets.sets, id.value) : null))

const set = ref<SetDetail | null>(null)
const notFound = ref(false)
// "I've seen these" mode: tap greyed posters to tick them, then save (design.md §5.3).
const selecting = ref(false)
const ticked = ref(new Set<number>())
const picked = ref<SearchResult | null>(null)
const busy = ref(false)
const toast = ref('')

// A set of nothing but upcoming films isn't complete yet.
const complete = computed(
  () => set.value && set.value.total > 0 && set.value.watched === set.value.total,
)
// Upcoming films are listed, but can't be ticked or logged until they're out.
const upcomingCount = computed(() => set.value?.films.filter((f) => f.upcoming).length ?? 0)

const loadError = ref('')
// Stepping through sets quickly: only the latest request may update the page.
let latest = 0

async function load() {
  const request = ++latest
  const wanted = id.value
  try {
    const loaded = await api<SetDetail>(`/sets/${wanted}`)
    if (request !== latest) return
    set.value = loaded
    notFound.value = false
    loadError.value = ''
  } catch (e) {
    if (request !== latest) return
    notFound.value = e instanceof ApiError && e.status === 404
    loadError.value = notFound.value ? '' : errorText(e)
  }
}

onMounted(() => {
  load()
  sets.load()
})
// Previous/next reuse this page: the ticks stay, so several sets can be ticked and saved
// in one go.
watch(id, load)

function flash(message: string) {
  toast.value = message
  setTimeout(() => (toast.value = ''), 2500)
}

function tap(film: SetFilm) {
  if (film.watched || film.upcoming) return
  if (selecting.value) {
    const next = new Set(ticked.value)
    if (!next.delete(film.tmdb_id)) next.add(film.tmdb_id)
    ticked.value = next
  } else {
    picked.value = { ...film, watch_count: 0, vote_average: 0, vote_count: 0 }
  }
}

const unwatched = computed(() => set.value?.films.filter((f) => !f.watched && !f.upcoming) ?? [])
const allTicked = computed(
  () => unwatched.value.length > 0 && unwatched.value.every((f) => ticked.value.has(f.tmdb_id)),
)

/** Big sets (every Best Picture winner) are a lot of tapping: tick or untick all of this
 * set's films, leaving ticks made in other sets alone. */
function tickAll() {
  const next = new Set(ticked.value)
  for (const f of unwatched.value) {
    if (allTicked.value) next.delete(f.tmdb_id)
    else next.add(f.tmdb_id)
  }
  ticked.value = next
}

const tickedElsewhere = computed(() => {
  const here = new Set(set.value?.films.map((f) => f.tmdb_id))
  return [...ticked.value].filter((tmdbId) => !here.has(tmdbId)).length
})

function cancelSelecting() {
  selecting.value = false
  ticked.value = new Set()
}

// Big saves show the ticket-box loading screen, as on "Movies I've seen".
const BIG_SAVE = 20
const progress = ref<{ done: number; total: number } | null>(null)

async function saveTicked() {
  busy.value = true
  try {
    const { added, events } = await saveSeen([...ticked.value], (done, total) => {
      if (total > BIG_SAVE) progress.value = { done, total }
    })
    rewards.push(events)
    cancelSelecting()
    flash(`Added ${added} film${added === 1 ? '' : 's'}`)
    await Promise.all([load(), sets.refresh()])
  } catch (e) {
    if (e instanceof PartialSaveError) {
      rewards.push(e.saved.events)
      await Promise.all([load(), sets.refresh().catch(() => {})])
    }
    flash(`Couldn't save them all: ${errorText(e)}`)
  } finally {
    busy.value = false
    progress.value = null
  }
}

async function onLogged(logged: Watch) {
  picked.value = null
  flash(
    logged.watched_on
      ? `Logged ${logged.film.title}`
      : `Added ${logged.film.title} to your library`,
  )
  await Promise.all([load(), sets.refresh()])
}
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <p v-if="notFound" class="muted">This set doesn't exist.</p>
    <LoadError v-else-if="loadError && !set" :message="loadError" @retry="load" />
    <template v-else-if="set">
      <RouterLink
        v-if="nav"
        class="button-link plain small up"
        :to="{ name: 'shelf', params: { kind: nav.shelf } }"
      >
        <AppIcon name="back" :size="14" /> {{ SHELF_TITLES[nav.shelf] }}
      </RouterLink>
      <nav v-if="nav && nav.count > 1" class="set-nav" :aria-label="`${nav.series}`">
        <RouterLink
          v-if="nav.prev"
          class="button-link plain small step"
          :to="{ name: 'set', params: { id: nav.prev.set.id } }"
          :aria-label="`Previous: ${nav.prev.set.title}`"
        >
          <AppIcon name="back" :size="14" /> <span class="step-label">{{ nav.prev.label }}</span>
        </RouterLink>
        <span v-else />
        <span class="where">{{ nav.series }} · {{ nav.position }} of {{ nav.count }}</span>
        <RouterLink
          v-if="nav.next"
          class="button-link plain small step"
          :to="{ name: 'set', params: { id: nav.next.set.id } }"
          :aria-label="`Next: ${nav.next.set.title}`"
        >
          <span class="step-label">{{ nav.next.label }}</span> <AppIcon name="forward" :size="14" />
        </RouterLink>
        <span v-else />
      </nav>
      <section class="ticket">
        <div class="heading">
          <h2>{{ set.title }}</h2>
          <span class="progress" :class="set.trophy">
            {{
              set.trophy === 'gold'
                ? 'Gold ✓'
                : set.trophy === 'silver'
                  ? `Silver · ${set.watched} of ${set.total}`
                  : `${set.watched} of ${set.total}`
            }}
          </span>
        </div>
        <TicketProgress :watched="set.watched" :total="set.total" />
        <span class="to-go">
          {{
            complete
              ? 'Every film watched. Take a bow.'
              : set.trophy === 'silver'
                ? `A new film joined. Watch it to polish this back to gold.`
                : `${set.total - set.watched} to go.`
          }}
          <template v-if="upcomingCount">
            {{ upcomingCount }} more {{ upcomingCount === 1 ? 'is' : 'are' }} on the way.
          </template>
        </span>
      </section>

      <div v-if="!complete && unwatched.length" class="hint-row">
        <span class="muted">
          {{ selecting ? "Tap the films you've already seen" : 'Tap a film to log it' }}
          <template v-if="selecting && tickedElsewhere">
            · {{ tickedElsewhere }} ticked in other sets</template
          >
        </span>
        <button v-if="!selecting" class="mustard small" @click="selecting = true">
          <AppIcon name="check" :size="14" /> Tick off seen
        </button>
      </div>

      <ul class="film-grid">
        <li v-for="film in set.films" :key="film.film_id">
          <FilmTile
            :title="film.title"
            :year="film.year"
            :poster-path="film.poster_path"
            :watch-count="film.watch_count"
            :muted="!film.watched && !ticked.has(film.tmdb_id)"
            :checked="ticked.has(film.tmdb_id)"
            :disabled="film.watched || film.upcoming"
            :badge="film.highlight ? 'Winner' : undefined"
            :upcoming="
              film.upcoming && film.release_date ? formatDate(film.release_date) : undefined
            "
            @click="tap(film)"
          />
        </li>
      </ul>

      <div v-if="selecting" class="action-bar">
        <button class="plain" @click="cancelSelecting">
          <AppIcon name="close" :size="14" /> Cancel
        </button>
        <button class="mustard tick-all" :aria-pressed="allTicked" @click="tickAll">
          <AppIcon :name="allTicked ? 'close' : 'check'" :size="14" />
          {{ allTicked ? 'Untick all' : 'Tick all' }}
        </button>
        <button
          :disabled="!ticked.size || busy"
          :aria-label="`Save ${ticked.size} as seen`"
          @click="saveTicked"
        >
          <AppIcon name="check" :size="14" /> Save {{ ticked.size || '' }}
        </button>
      </div>
    </template>

    <nav v-if="set && nav && (nav.prev || nav.next)" class="set-nav bottom" aria-label="More sets">
      <RouterLink
        v-if="nav.prev"
        class="button-link plain small step"
        :to="{ name: 'set', params: { id: nav.prev.set.id } }"
        :aria-label="`Previous: ${nav.prev.set.title}`"
      >
        <AppIcon name="back" :size="14" /> <span class="step-label">{{ nav.prev.label }}</span>
      </RouterLink>
      <span v-else />
      <RouterLink
        v-if="nav.next"
        class="button-link plain small step"
        :to="{ name: 'set', params: { id: nav.next.set.id } }"
        :aria-label="`Next: ${nav.next.set.title}`"
      >
        <span class="step-label">{{ nav.next.label }}</span> <AppIcon name="forward" :size="14" />
      </RouterLink>
    </nav>

    <TmdbCredit />

    <BulkProgress v-if="progress" :done="progress.done" :total="progress.total" />

    <LogSheet v-if="picked" :film="picked" @logged="onLogged" @close="picked = null" />
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </main>
</template>

<style scoped>
.ticket {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #2a1a12;
  color: #f6ebd9;
  --hole-on: #f6ebd9;
  --hole-off: #8a7360;
}

.heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.heading h2 {
  margin: 0;
  font-size: 1.5rem;
}

.progress {
  font-family: var(--mono);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mustard);
  white-space: nowrap;
}

.progress.silver {
  color: #c3c7cc;
}

.to-go {
  font-size: 0.85rem;
  color: #e8d9c2;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1rem 0;
}

/* Where you are in the series, then previous and next under it. */
.up {
  margin-bottom: 0.9rem;
}

.set-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 0.4rem 0.75rem;
  margin-bottom: 0.9rem;
}

.set-nav.bottom {
  margin: 1.5rem 0 0;
}

.step {
  max-width: 100%;
  min-width: 0;
}

.step:first-child {
  justify-self: start;
}

.step:last-child {
  justify-self: end;
}

.step-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.where {
  grid-column: 1 / -1;
  order: -1;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: var(--muted);
}

.tick-all {
  white-space: nowrap;
}

.ticket + .film-grid {
  margin-top: 1.25rem;
}
</style>
