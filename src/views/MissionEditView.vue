<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { api, errorText, post } from '@/api/client'
import type {
  AdminMission,
  Genre,
  GoalKind,
  MissionCheck,
  MissionEvent,
  MissionGoal,
  MissionInput,
  SetSummary,
} from '@/api/types'
import AdminFilmPicker, { type PickedFilm } from '@/components/AdminFilmPicker.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import ChoiceGroup from '@/components/ChoiceGroup.vue'
import PublishActions from '@/components/PublishActions.vue'
import StatusPill from '@/components/StatusPill.vue'
import { useAdminRecord } from '@/composables/useAdminRecord'
import { formatDate } from '@/lib/format'
import { seasonText } from '@/lib/missions'
import { useRewardsStore } from '@/stores/rewards'

// One mission (design.md §6.6): write it, test it, then enable it. A new mission is a draft.
// Switching it off ends it quietly for everyone; people who finished it keep it.
const rewards = useRewardsStore()

const genres = ref<Genre[]>([])
const sets = ref<SetSummary[]>([])
const loading = ref(true)

const year = new Date().getFullYear()
const form = reactive({
  title: '',
  key: '',
  description: '',
  finishCopy: '',
  notes: '',
  openEnded: false,
  startsOn: `${year}-12-18`,
  endsOn: `${year}-12-31`,
  repeatsYearly: true,
  joinUntil: '',
  announceFrom: '',
  kind: 'count_matching' as GoalKind,
  count: 3,
  countWhat: 'keyword' as 'genre' | 'keyword',
  genre: '',
  keyword: 0,
  listFrom: 'films' as 'films' | 'set',
  films: [] as PickedFilm[],
  setId: 0,
  rewatchesCount: false,
})

const GOAL_KINDS = [
  { value: 'count_matching', label: 'N films of a genre or keyword' },
  { value: 'all_of_list', label: 'All of a list' },
  { value: 'count_of_list', label: 'N of a list' },
] as const
const COUNTING = [
  { value: 'keyword', label: 'A keyword (Christmas…)' },
  { value: 'genre', label: 'A genre' },
] as const
const LIST_FROM = [
  { value: 'films', label: 'Films I pick' },
  { value: 'set', label: 'A set' },
] as const

const {
  id,
  record: mission,
  load,
  keyEdited,
  act,
  busy,
  error,
  status,
  save: saveBody,
  enable,
  disable,
  remove,
} = useAdminRecord<AdminMission>({
  path: '/admin/missions',
  routes: { one: 'admin-mission', list: 'admin-missions' },
  form,
  switchedOff: 'Switched off: it has ended quietly for everyone',
  fill: (from) => {
    const g = from.goal
    Object.assign(form, {
      title: from.title,
      key: from.key,
      description: from.description,
      finishCopy: from.finish_copy ?? '',
      notes: from.notes ?? '',
      openEnded: from.starts_on === null,
      startsOn: from.starts_on ?? form.startsOn,
      endsOn: from.ends_on ?? form.endsOn,
      repeatsYearly: from.repeats_yearly,
      joinUntil: from.join_until ?? '',
      announceFrom: from.announce_from ?? '',
      kind: g.kind,
      count: g.count ?? form.count,
      countWhat: g.genre ? 'genre' : 'keyword',
      genre: g.genre ?? '',
      keyword: g.keyword ?? 0,
      listFrom: from.set_id ? 'set' : 'films',
      films: from.films.map((f) => ({ ...f })),
      setId: from.set_id ?? 0,
      rewatchesCount: from.rewatches_count,
    })
  },
})

const realGenres = computed(() => genres.value.filter((g) => !g.keyword))
const keywords = computed(() => genres.value.filter((g) => g.keyword))

const body = computed<MissionInput>(() => {
  const fromSet = form.kind !== 'count_matching' && form.listFrom === 'set'
  const films = fromSet ? {} : { films: form.films.map((f) => f.tmdb_id) }
  let goal: MissionGoal
  if (form.kind === 'count_matching')
    goal =
      form.countWhat === 'genre'
        ? { kind: form.kind, count: form.count, genre: form.genre }
        : { kind: form.kind, count: form.count, keyword: form.keyword }
  else if (form.kind === 'count_of_list') goal = { kind: form.kind, count: form.count, ...films }
  else goal = { kind: form.kind, ...films }
  return {
    key: form.key,
    title: form.title.trim(),
    description: form.description.trim(),
    finish_copy: form.finishCopy.trim() || null,
    notes: form.notes.trim() || null,
    starts_on: form.openEnded ? null : form.startsOn,
    ends_on: form.openEnded ? null : form.endsOn,
    repeats_yearly: !form.openEnded && form.repeatsYearly,
    join_until: form.joinUntil || null,
    announce_from: form.openEnded ? null : form.announceFrom || null,
    goal,
    set_id: fromSet ? form.setId || null : null,
    rewatches_count: form.rewatchesCount,
  }
})

const missing = computed(() => {
  if (!form.title.trim()) return 'Give it a title.'
  if (!form.key) return 'Give it a key.'
  if (!form.description.trim()) return 'Say what it is: people read this before joining.'
  if (!form.openEnded && (!form.startsOn || !form.endsOn)) return 'Give it a start and an end.'
  if (!form.openEnded && form.endsOn < form.startsOn) return 'The end is before the start.'
  if (form.kind === 'count_matching' && form.countWhat === 'genre' && !form.genre)
    return 'Pick a genre.'
  if (form.kind === 'count_matching' && form.countWhat === 'keyword' && !form.keyword)
    return 'Pick a keyword.'
  if (form.kind !== 'count_matching' && form.listFrom === 'films' && !form.films.length)
    return 'Pick the films.'
  if (form.kind !== 'count_matching' && form.listFrom === 'set' && !form.setId) return 'Pick a set.'
  return null
})

const save = () => saveBody(body.value)

function showCard() {
  const event: MissionEvent = {
    kind: 'mission',
    key: form.key,
    title: form.title || 'Untitled mission',
    finish_copy: form.finishCopy.trim() || null,
    year: form.openEnded ? null : Number(form.startsOn.slice(0, 4)),
    count: form.kind === 'all_of_list' ? form.films.length || 1 : form.count,
  }
  rewards.queue.push(event)
}

const check = ref<MissionCheck | null>(null)
const runCheck = () =>
  act(async () => {
    check.value = await post<MissionCheck>('/admin/missions/check', body.value)
  }, '')

onMounted(async () => {
  try {
    ;[genres.value, sets.value] = await Promise.all([
      api<Genre[]>('/genres'),
      api<SetSummary[]>('/sets'),
    ])
    if (id.value !== null) load(await api<AdminMission>(`/admin/missions/${id.value}`))
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <RouterLink class="button-link plain small back" :to="{ name: 'admin-missions' }">
      <AppIcon name="back" :size="14" /> All missions
    </RouterLink>

    <p v-if="loading" class="muted">Loading…</p>
    <template v-else>
      <div class="heading">
        <h2>{{ mission ? mission.title : 'New mission' }}</h2>
        <StatusPill v-if="mission" :status="mission.status" />
        <span v-if="mission" class="muted">
          {{ mission.joined }} in this season · done {{ mission.finished }}×
        </span>
      </div>

      <div class="layout">
        <form class="panel stack" @submit.prevent="save">
          <span class="label">The mission</span>
          <label>
            Title
            <input v-model="form.title" maxlength="80" placeholder="Christmas Week" />
          </label>
          <label>
            Key
            <input
              v-model="form.key"
              maxlength="40"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              :disabled="mission?.key_locked"
              @input="keyEdited"
            />
            <span class="hint">{{
              mission?.key_locked
                ? 'Fixed now that it has gone live.'
                : 'Lowercase words and dashes. It can’t change once the mission goes live.'
            }}</span>
          </label>
          <label>
            Description
            <textarea
              v-model="form.description"
              rows="2"
              maxlength="2000"
              placeholder="What people read before joining"
            />
          </label>
          <label>
            When it's finished
            <textarea
              v-model="form.finishCopy"
              rows="2"
              maxlength="500"
              placeholder="Optional: the line on the finishing card"
            />
          </label>

          <span class="label">Season</span>
          <label class="check">
            <input v-model="form.openEnded" type="checkbox" /> Open-ended (no dates; counts from
            joining)
          </label>
          <template v-if="!form.openEnded">
            <div class="row">
              <label>
                Starts
                <input v-model="form.startsOn" type="date" />
              </label>
              <label>
                Ends
                <input v-model="form.endsOn" type="date" />
              </label>
            </div>
            <label class="check">
              <input v-model="form.repeatsYearly" type="checkbox" /> Same dates every year
            </label>
            <label>
              Show it from
              <input v-model="form.announceFrom" type="date" />
              <span class="hint">Optional: visible and joinable before it starts.</span>
            </label>
          </template>
          <label>
            Last day to join
            <input v-model="form.joinUntil" type="date" />
            <span class="hint"
              >Optional. Joining late costs nothing: progress counts from the start.</span
            >
          </label>
          <p v-if="!form.openEnded" class="muted">
            {{ seasonText(form.startsOn, form.endsOn) }}
            <template v-if="form.repeatsYearly"> · every year</template>
          </p>

          <span class="label">Goal</span>
          <ChoiceGroup v-model="form.kind" label="Goal" :options="GOAL_KINDS" />
          <label v-if="form.kind !== 'all_of_list'">
            How many films
            <input v-model.number="form.count" type="number" min="1" max="500" class="num" />
          </label>
          <template v-if="form.kind === 'count_matching'">
            <ChoiceGroup v-model="form.countWhat" label="Counting" :options="COUNTING" />
            <label v-if="form.countWhat === 'genre'">
              Genre
              <select v-model="form.genre">
                <option value="" disabled>Pick a genre</option>
                <option v-for="g in realGenres" :key="g.id" :value="g.name">{{ g.name }}</option>
              </select>
            </label>
            <label v-else>
              Keyword
              <select v-model.number="form.keyword">
                <option :value="0" disabled>Pick a keyword</option>
                <option v-for="g in keywords" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </label>
          </template>
          <template v-else>
            <ChoiceGroup v-model="form.listFrom" label="List" :options="LIST_FROM" />
            <AdminFilmPicker
              v-if="form.listFrom === 'films'"
              v-model="form.films"
              multiple
              label="Add films"
            />
            <label v-else>
              Set
              <select v-model.number="form.setId">
                <option :value="0" disabled>Pick a set</option>
                <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.title }}</option>
              </select>
            </label>
          </template>
          <label class="check">
            <input v-model="form.rewatchesCount" type="checkbox" /> Rewatches count
          </label>

          <span class="label">Notes</span>
          <label>
            Notes for admins
            <textarea v-model="form.notes" rows="2" maxlength="2000" placeholder="Optional" />
          </label>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-else-if="status" class="muted" role="status">{{ status }}</p>
          <div class="actions">
            <button type="submit" :disabled="busy || Boolean(missing)" :title="missing ?? ''">
              <AppIcon name="check" :size="14" /> {{ mission ? 'Save' : 'Save as draft' }}
            </button>
            <PublishActions
              v-if="mission"
              :status="mission.status"
              :deletable="!mission.finished"
              :busy="busy"
              icon="trophy"
              @enable="enable"
              @disable="disable"
              @remove="remove"
            />
          </div>
          <p v-if="missing" class="hint">{{ missing }}</p>
          <p v-if="mission && mission.status === 'live'" class="hint">
            Switching off ends it quietly for everyone: it disappears, with no "failed". Anyone who
            finished it keeps it.
          </p>
        </form>

        <aside class="panel stack">
          <span class="label">Test it</span>
          <p class="hint">Tests use the form as it is now, saved or not.</p>
          <button type="button" class="plain" @click="showCard">
            <AppIcon name="eye" :size="14" /> Show me the finishing card
          </button>
          <button
            type="button"
            class="plain"
            :disabled="busy || Boolean(missing)"
            @click="runCheck"
          >
            <AppIcon name="search" :size="14" /> Check the latest season
          </button>
          <template v-if="check">
            <p v-if="!check.season_start" class="muted">
              No season has started yet{{
                form.openEnded ? ' (open-ended missions count from joining)' : ''
              }}.
            </p>
            <p v-else>
              If everyone had joined {{ formatDate(check.season_start) }} –
              {{ formatDate(check.season_end!) }}: <strong>{{ check.finished }}</strong> would have
              finished, and <strong>{{ check.started }}</strong> got somewhere.
            </p>
            <p class="hint">Counts only, never whose.</p>
          </template>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.back {
  margin-bottom: 0.9rem;
}

.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.heading h2 {
  margin: 0;
}

.layout {
  display: grid;
  gap: 1rem;
}

.panel {
  padding: 1.1rem;
  border: 2px solid var(--line);
  border-radius: 0.8rem;
  background: var(--card);
  min-width: 0;
}

.label {
  margin-top: 0.4rem;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--muted);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.check {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.num {
  width: 7rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

@media (min-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: start;
  }
}
</style>
