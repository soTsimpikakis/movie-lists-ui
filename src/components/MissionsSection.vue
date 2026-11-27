<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, post } from '@/api/client'
import type { MissionEvent, MissionsPage, UserMission } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { formatDate } from '@/lib/format'
import { goalText, seasonText } from '@/lib/missions'
import { useRewardsStore } from '@/stores/rewards'

// Missions at the top of the Journey (design.md §6.6, M1): ones you can join, and ones you're
// in, with progress. The end date shows on the mission and that's all: no reminders, no
// countdowns. A mission that runs out just goes; finished ones stay listed underneath.
const rewards = useRewardsStore()
const page = ref<MissionsPage | null>(null)
const error = ref('')
const busy = ref<number | null>(null)

async function load() {
  try {
    page.value = await api<MissionsPage>('/missions')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function join(m: UserMission) {
  error.value = ''
  busy.value = m.id
  try {
    const joined = await post<{ mission: UserMission; events: MissionEvent[] }>(
      `/missions/${m.id}/join`,
    )
    rewards.push(joined.events)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = null
  }
}

async function leave(m: UserMission) {
  error.value = ''
  busy.value = m.id
  try {
    await post(`/missions/${m.id}/leave`)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <section v-if="page && (page.missions.length || page.finished.length)" aria-labelledby="missions">
    <h3 id="missions">Missions</h3>
    <p v-if="error" class="error">{{ error }}</p>
    <ul class="missions">
      <li v-for="m in page.missions" :key="m.id" class="mission" :class="{ done: m.finished }">
        <div class="band">
          <span class="title">{{ m.title }}</span>
          <span class="season">{{ seasonText(m.starts_on, m.ends_on) }}</span>
        </div>
        <div class="body">
          <p class="description">{{ m.description }}</p>
          <p class="goal">
            {{
              goalText({
                goal_kind: m.goal_kind,
                goal_subject: m.goal_subject,
                needed: m.needed,
                listed: m.films.length,
              })
            }}<template v-if="m.rewatches_count"> · rewatches count</template>
          </p>
          <ul v-if="m.films.length" class="films">
            <li v-for="f in m.films" :key="f.tmdb_id" class="film" :class="{ seen: f.seen }">
              <template v-if="f.seen">✓ </template>{{ f.title }}
            </li>
          </ul>
          <template v-if="m.joined">
            <TicketProgress class="holes" :watched="m.done" :total="m.needed" />
            <p class="state">
              <template v-if="m.finished">✓ Done</template>
              <template v-else>{{ m.done }} of {{ m.needed }}</template>
            </p>
          </template>
          <p v-else-if="m.join_until && m.joinable" class="muted small">
            Join by {{ formatDate(m.join_until) }}
          </p>
          <div class="actions">
            <button
              v-if="!m.joined && m.joinable"
              type="button"
              class="small"
              :disabled="busy === m.id"
              @click="join(m)"
            >
              <AppIcon name="plus" :size="14" /> Join
            </button>
            <button
              v-else-if="m.joined && !m.finished"
              type="button"
              class="plain small"
              :disabled="busy === m.id"
              @click="leave(m)"
            >
              Leave
            </button>
          </div>
        </div>
      </li>
    </ul>
    <p v-if="page.finished.length" class="finished">
      <span class="label">Done</span>
      <span v-for="f in page.finished" :key="`${f.key}-${f.year}`" class="chip">
        ✓ {{ f.title }}<template v-if="f.year"> {{ f.year }}</template>
      </span>
    </p>
  </section>
</template>

<style scoped>
/* Like the Journey's other section headings; the first one on the page, so no top margin. */
h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.missions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
}

.mission {
  border: 2px solid var(--ticket-line);
  border-radius: 0.7rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  filter: var(--ticket-shadow);
  overflow: hidden;
}

.band {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.55rem 0.9rem;
  border-bottom: 2px dashed var(--ticket-line);
  background: var(--red);
  color: var(--on-red);
}

.done .band {
  background: var(--mustard);
  color: var(--on-mustard);
}

.title {
  font-family: var(--ticket-title);
  font-weight: 700;
  font-size: 1.1rem;
}

.season {
  font-family: var(--ticket-type);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem 0.9rem;
}

.description,
.goal,
.state {
  margin: 0;
}

.goal {
  font-family: var(--ticket-type);
  font-size: 0.85rem;
  color: var(--parchment-muted);
}

.films {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.film {
  padding: 0.1rem 0.55rem;
  border: 1.5px dashed var(--parchment-muted);
  border-radius: 999px;
  font-size: 0.85rem;
}

.film.seen {
  border-style: solid;
  border-color: var(--red);
  color: var(--red);
}

.holes {
  --hole-on: var(--red);
  --hole-off: var(--parchment-muted);
}

.done .holes {
  --hole-on: var(--mustard);
}

.state {
  font-family: var(--ticket-type);
  font-size: 0.85rem;
}

.small {
  font-size: 0.85rem;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions:empty {
  display: none;
}

.finished {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0.8rem 0 0;
}

.chip {
  padding: 0.1rem 0.6rem;
  border: 1.5px solid var(--mustard);
  border-radius: 999px;
  font-size: 0.85rem;
}

@media (min-width: 900px) {
  .missions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
