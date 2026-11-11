<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api/client'
import type { Journey, JourneyLevel } from '@/api/types'
import AppHeader from '@/components/AppHeader.vue'
import LevelPips from '@/components/LevelPips.vue'
import PassportStamp from '@/components/PassportStamp.vue'
import { formatDate } from '@/lib/format'
import { decadeLabel, films, LEVEL_NAMES, LEVEL_THRESHOLDS } from '@/lib/journey'
import { userTag } from '@/lib/username'
import { useAuthStore } from '@/stores/auth'
import { useReactionsStore } from '@/stores/reactions'

// Journey (design.md §12, 6B): the user's whole movie journey in one place. Summary,
// Expertise (genres), Eras (decades), Passport (countries) and set Trophies.
const auth = useAuthStore()
const reactions = useReactionsStore()
const journey = ref<Journey | null>(null)
const thisYear = new Date().getFullYear()

onMounted(async () => {
  reactions.load()
  journey.value = await api<Journey>('/journey')
})

const topReaction = computed(() => {
  const top = journey.value?.summary.top_reaction
  return top ? { ...top, info: reactions.byKey.get(top.name) } : null
})

/** Progress from this level's threshold to the next, 0–100. */
function toNext(entry: JourneyLevel): number {
  if (entry.next_at === null) return 100
  const from = entry.level ? LEVEL_THRESHOLDS[entry.level - 1]! : 0
  return Math.min(100, Math.round((100 * (entry.count - from)) / (entry.next_at - from)))
}

function nextLabel(entry: JourneyLevel): string {
  if (entry.next_at === null) return 'Top level'
  return `${entry.next_at - entry.count} to ${LEVEL_NAMES[entry.level]}`
}

/** Every decade from the 1920s (or earlier, if watched) to now, watched or not. */
const eras = computed(() => {
  const watched = new Map((journey.value?.eras ?? []).map((e) => [e.subject, e]))
  const first = Math.min(1920, ...[...watched.keys()].map(Number))
  const last = Math.floor(new Date().getFullYear() / 10) * 10
  const out: JourneyLevel[] = []
  for (let decade = first; decade <= last; decade += 10) {
    const key = String(decade)
    out.push(watched.get(key) ?? { subject: key, count: 0, level: 0, level_name: null, next_at: 5 })
  }
  return out
})

// Stamps are pressed on a little crooked, each the same way every visit.
const tilt = (code: string) => ((code.charCodeAt(0) * 7 + code.charCodeAt(1) * 3) % 21) - 10
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <div class="heading">
      <h2>Journey</h2>
      <span v-if="auth.user" class="tag">{{ userTag(auth.user) }}</span>
    </div>

    <p v-if="journey === null" class="muted">Loading…</p>
    <template v-else>
      <!-- The summary is a ticket stub of big numbers. -->
      <section class="ticket summary" aria-label="Summary">
        <div class="seats">
          <span class="seat">
            <span class="seat-label">Films</span>
            <span class="seat-value">{{ journey.summary.films }}</span>
          </span>
          <span class="seat">
            <span class="seat-label">Hours</span>
            <span class="seat-value">{{ journey.summary.hours }}</span>
          </span>
          <span class="seat">
            <span class="seat-label">{{ thisYear }}</span>
            <span class="seat-value">{{ journey.summary.this_year }}</span>
          </span>
          <span class="seat">
            <span class="seat-label">Stamps</span>
            <span class="seat-value">{{ journey.passport.length }}</span>
          </span>
        </div>
        <dl class="facts">
          <div v-if="journey.summary.first_ticket">
            <dt>First ticket</dt>
            <dd>
              {{ journey.summary.first_ticket.title }} ·
              {{ formatDate(journey.summary.first_ticket.watched_on) }}
            </dd>
          </div>
          <div v-if="journey.summary.oldest_film">
            <dt>Oldest film</dt>
            <dd>
              {{ journey.summary.oldest_film.title }} ({{ journey.summary.oldest_film.year }})
            </dd>
          </div>
          <div v-if="topReaction">
            <dt>Most felt</dt>
            <dd>
              <span class="emoji">{{ topReaction.info?.emoji }}</span>
              {{ topReaction.info?.label ?? topReaction.name }} ×{{ topReaction.count }}
            </dd>
          </div>
          <div v-if="journey.summary.top_genre">
            <dt>Top genre</dt>
            <dd>
              {{ journey.summary.top_genre.name }} ·
              {{ films(journey.summary.top_genre.count) }}
            </dd>
          </div>
        </dl>
        <p v-if="!journey.summary.films" class="empty">
          Your journey starts with your first ticket. Log a film, or tick off ones you've seen.
        </p>
      </section>

      <div class="columns">
        <section aria-labelledby="expertise">
          <h3 id="expertise">Expertise</h3>
          <p v-if="!journey.expertise.length" class="muted">No genres yet.</p>
          <ul class="levels">
            <li v-for="g in journey.expertise" :key="g.subject" class="level-row">
              <span class="level-top">
                <span class="level-name">{{ g.subject }}</span>
                <LevelPips :level="g.level" />
              </span>
              <span class="bar" aria-hidden="true">
                <span class="fill" :style="{ width: `${toNext(g)}%` }" />
              </span>
              <span class="level-meta">
                <span>{{ g.level_name ?? 'Getting started' }} · {{ films(g.count) }}</span>
                <span>{{ nextLabel(g) }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="eras">
          <h3 id="eras">Eras</h3>
          <ol class="eras">
            <li
              v-for="e in eras"
              :key="e.subject"
              class="era"
              :class="{ empty: !e.count }"
              :aria-label="`${decadeLabel(e.subject)}: ${films(e.count)}${e.level_name ? `, ${e.level_name}` : ''}`"
            >
              <span class="era-name">{{ decadeLabel(e.subject) }}</span>
              <span class="era-count">{{ e.count }}</span>
              <LevelPips :level="e.level" />
            </li>
          </ol>
        </section>
      </div>

      <section aria-labelledby="passport">
        <h3 id="passport">Passport</h3>
        <div class="passport">
          <p v-if="!journey.passport.length" class="muted">
            No stamps yet. Every country you watch a film from gets one.
          </p>
          <div v-for="s in journey.passport" :key="s.code" class="stamp-slot">
            <PassportStamp :code="s.code" :tilt="tilt(s.code)" />
            <span class="stamp-count">{{ films(s.count) }}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="trophies">
        <h3 id="trophies">Trophies</h3>
        <p v-if="!journey.trophies.length" class="muted">Complete a set to earn its gold trophy.</p>
        <ul class="trophies">
          <li v-for="t in journey.trophies" :key="t.set_id">
            <RouterLink
              class="trophy"
              :class="t.trophy"
              :to="{ name: 'set', params: { id: t.set_id } }"
            >
              <span class="trophy-title">{{ t.title }}</span>
              <span class="trophy-stub">
                {{ t.trophy === 'gold' ? `✓ All ${t.total}` : `${t.watched} of ${t.total}` }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.heading h2 {
  margin: 0;
  font-size: 1.15rem;
}

.tag {
  font-family: var(--ticket-type);
  color: var(--red);
}

h3 {
  margin: 1.75rem 0 0.75rem;
  font-size: 1rem;
}

/* Parchment cards, the same paper as the Watched tickets. */
.ticket,
.passport,
.levels,
.eras {
  border: 2px solid var(--ticket-line);
  border-radius: 0.75rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  filter: var(--ticket-shadow);
}

.summary {
  padding: 1rem 1.1rem;
}

.seats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.seat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0 0.6rem;
  font-family: var(--ticket-type);
}

.seat:first-child {
  padding-left: 0;
}

.seat + .seat {
  border-left: 2px dashed var(--ticket-line);
}

.seat-label {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--parchment-muted);
}

.seat-value {
  font-size: 1.6rem;
  line-height: 1.1;
}

.facts {
  display: grid;
  gap: 0.4rem;
  margin: 1rem 0 0;
  padding-top: 0.9rem;
  border-top: 2px dashed var(--ticket-line);
}

.facts div {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
}

.facts dt {
  flex: none;
  width: 6.5rem;
  font-family: var(--ticket-type);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--parchment-muted);
}

.facts dd {
  margin: 0;
  min-width: 0;
  font-family: var(--ticket-title);
  font-weight: 700;
}

.empty {
  margin: 0.75rem 0 0;
}

.levels,
.eras {
  list-style: none;
  margin: 0;
  padding: 0.4rem 1rem;
}

.level-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0;
}

.level-row + .level-row {
  border-top: 2px dashed var(--ticket-line);
}

.level-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.level-name {
  font-family: var(--ticket-title);
  font-weight: 700;
}

.levels,
.eras {
  --pip-on: var(--red);
  --pip-off: var(--parchment-muted);
}

.bar {
  height: 0.45rem;
  border-radius: 999px;
  background: rgb(120 80 30 / 0.18);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--red);
}

.level-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-family: var(--ticket-type);
  font-size: 0.75rem;
  color: var(--parchment-muted);
}

.eras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.era {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.7rem 0.3rem;
  border-right: 2px dashed var(--ticket-line);
  border-bottom: 2px dashed var(--ticket-line);
  margin: 0 -2px -2px 0;
}

.era.empty {
  opacity: 0.45;
}

.era-name {
  font-family: var(--ticket-type);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
}

.era-count {
  font-family: var(--ticket-title);
  font-weight: 700;
  font-size: 1.3rem;
  line-height: 1;
}

.era :deep(.pip) {
  width: 0.5rem;
  height: 0.5rem;
  border-width: 1.5px;
}

.passport {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.4rem, 1fr));
  justify-items: center;
  gap: 1rem 0.5rem;
  padding: 1.1rem 0.8rem;
  --stamp-paper: var(--parchment);
}

.passport .muted {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--parchment-muted);
}

.stamp-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.stamp-count {
  font-family: var(--ticket-type);
  font-size: 0.75rem;
  color: var(--parchment-muted);
}

.trophies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.trophy {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--ticket-line);
  border-radius: 0.6rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  text-decoration: none;
  filter: var(--ticket-shadow);
  overflow: hidden;
}

.trophy-title {
  flex: 1;
  padding: 0.7rem 0.9rem;
  font-family: var(--ticket-title);
  font-weight: 700;
}

.trophy-stub {
  display: grid;
  place-items: center;
  padding: 0 0.9rem;
  border-left: 2px dashed var(--ticket-line);
  font-family: var(--ticket-type);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--mustard);
  color: var(--on-mustard);
}

.silver .trophy-stub {
  background: #c3c7cc;
  color: #2a1a12;
}

@media (min-width: 900px) {
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 1.5rem;
    align-items: start;
  }

  .trophies {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
