<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, del, post, put } from '@/api/client'
import type { AdminEgg, EggCheck, EggInput, EggTry, Genre } from '@/api/types'
import AdminFilmPicker, { type PickedFilm } from '@/components/AdminFilmPicker.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import { formatDate, todayIso } from '@/lib/format'
import {
  daysIn,
  keyFrom,
  matchKind,
  MONTHS,
  previewEvent,
  whenText,
  type MatchKind,
} from '@/lib/eggs'
import { useRewardsStore } from '@/stores/rewards'

// One easter egg (design.md §6.6): write it, test it (the real card, past matches, "try a
// log"), then enable it. A new egg is a draft, so an idea can wait here without its lore.
const route = useRoute()
const router = useRouter()
const rewards = useRewardsStore()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const egg = ref<AdminEgg | null>(null)
const genres = ref<Genre[]>([])
const loading = ref(true)
const error = ref('')
const status = ref('')
const busy = ref(false)

const form = reactive({
  title: '',
  key: '',
  lore: '',
  hint: '',
  notes: '',
  startMonth: 12,
  startDay: 25,
  endMonth: 12,
  endDay: 25,
  singleDay: true,
  onlyOneYear: false,
  onlyYear: new Date().getFullYear(),
  kind: 'film' as MatchKind,
  films: [] as PickedFilm[],
  genre: '',
  keyword: 0,
  minCount: 1,
  repeat: 'yearly' as 'yearly' | 'once',
})
// The key follows the title until it's edited by hand or locked.
const keyTouched = ref(false)
watch(
  () => form.title,
  (title) => {
    if (!keyTouched.value && !egg.value?.key_locked) form.key = keyFrom(title)
  },
)
watch(
  () => [form.singleDay, form.startMonth, form.startDay],
  () => {
    if (form.singleDay) {
      form.endMonth = form.startMonth
      form.endDay = form.startDay
    }
  },
)
// Keep days real when the month changes (31 Apr -> 30 Apr).
watch(
  () => form.startMonth,
  (m) => (form.startDay = Math.min(form.startDay, daysIn(m))),
)
watch(
  () => form.endMonth,
  (m) => (form.endDay = Math.min(form.endDay, daysIn(m))),
)

const realGenres = computed(() => genres.value.filter((g) => !g.keyword))
const keywords = computed(() => genres.value.filter((g) => g.keyword))
const days = (month: number) => Array.from({ length: daysIn(month) }, (_, i) => i + 1)

function load(from: AdminEgg) {
  egg.value = from
  keyTouched.value = true
  Object.assign(form, {
    title: from.title,
    key: from.key,
    lore: from.lore ?? '',
    hint: from.hint ?? '',
    notes: from.notes ?? '',
    startMonth: from.start_month,
    startDay: from.start_day,
    endMonth: from.end_month,
    endDay: from.end_day,
    singleDay: from.start_month === from.end_month && from.start_day === from.end_day,
    onlyOneYear: from.only_year !== null,
    onlyYear: from.only_year ?? new Date().getFullYear(),
    kind: matchKind(from.match),
    films: from.films.map((f) => ({ ...f })),
    genre: from.match.genre ?? '',
    keyword: from.match.keyword ?? 0,
    minCount: from.min_count,
    repeat: from.repeat,
  })
}

const body = computed<EggInput>(() => {
  const ids = form.films.map((f) => f.tmdb_id)
  const match =
    form.kind === 'film'
      ? { film: ids[0] }
      : form.kind === 'films'
        ? { films: ids }
        : form.kind === 'genre'
          ? { genre: form.genre }
          : { keyword: form.keyword }
  return {
    key: form.key,
    title: form.title.trim(),
    lore: form.lore.trim() || null,
    hint: form.hint.trim() || null,
    notes: form.notes.trim() || null,
    start_month: form.startMonth,
    start_day: form.startDay,
    end_month: form.endMonth,
    end_day: form.endDay,
    only_year: form.onlyOneYear ? form.onlyYear : null,
    match,
    min_count: form.kind === 'film' ? 1 : form.minCount,
    repeat: form.repeat,
  }
})

/** What's missing before it can be saved, in words; null when it's ready. */
const missing = computed(() => {
  if (!form.title.trim()) return 'Give it a title.'
  if (!form.key) return 'Give it a key.'
  if (form.kind === 'film' && form.films.length !== 1) return 'Pick the film.'
  if (form.kind === 'films' && !form.films.length) return 'Pick at least one film.'
  if (form.kind === 'genre' && !form.genre) return 'Pick a genre.'
  if (form.kind === 'keyword' && !form.keyword) return 'Pick a keyword.'
  return null
})

async function act(work: () => Promise<void>, done: string) {
  error.value = ''
  status.value = ''
  busy.value = true
  try {
    await work()
    status.value = done
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

const save = () =>
  act(async () => {
    if (id.value === null) {
      const created = await post<AdminEgg>('/admin/eggs', body.value)
      load(created)
      await router.replace({ name: 'admin-egg', params: { id: created.id } })
    } else load(await put<AdminEgg>(`/admin/eggs/${id.value}`, body.value))
  }, 'Saved')

const enable = () =>
  act(async () => load(await post<AdminEgg>(`/admin/eggs/${id.value}/enable`)), 'Live')
const disable = () =>
  act(async () => load(await post<AdminEgg>(`/admin/eggs/${id.value}/disable`)), 'Switched off')

const confirmDelete = ref(false)
const remove = () =>
  act(async () => {
    await del(`/admin/eggs/${id.value}`)
    await router.push({ name: 'admin' })
  }, 'Deleted')

// --- testing ---
function showCard() {
  rewards.queue.push(previewEvent(body.value, form.films[0]?.title ?? 'a film'))
}

const check = ref<EggCheck | null>(null)
const runCheck = () =>
  act(async () => {
    check.value = await post<EggCheck>('/admin/eggs/check', body.value)
  }, '')

const tryFilm = ref<PickedFilm[]>([])
const tryDate = ref(todayIso())
const tried = ref<EggTry | null>(null)
const runTry = () =>
  act(async () => {
    tried.value = await post<EggTry>('/admin/eggs/try', {
      egg: body.value,
      tmdb_id: tryFilm.value[0]!.tmdb_id,
      watched_on: tryDate.value,
    })
  }, '')

onMounted(async () => {
  try {
    genres.value = await api<Genre[]>('/genres')
    if (id.value !== null) load(await api<AdminEgg>(`/admin/eggs/${id.value}`))
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <RouterLink class="button-link plain small back" :to="{ name: 'admin' }">
      <AppIcon name="back" :size="14" /> All eggs
    </RouterLink>

    <p v-if="loading" class="muted">Loading…</p>
    <template v-else>
      <div class="heading">
        <h2>{{ egg ? egg.title : 'New easter egg' }}</h2>
        <span v-if="egg" class="pill" :class="egg.status">{{ egg.status }}</span>
        <span v-if="egg" class="muted">
          found {{ egg.found }}×<template v-if="egg.live_since">
            · live since {{ formatDate(egg.live_since.slice(0, 10)) }}</template
          >
        </span>
      </div>

      <div class="layout">
        <form class="panel stack" @submit.prevent="save">
          <span class="label">The egg</span>
          <label>
            Title
            <input v-model="form.title" maxlength="80" placeholder="Remember, remember" />
          </label>
          <label>
            Key
            <input
              v-model="form.key"
              maxlength="40"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              :disabled="egg?.key_locked"
              @input="keyTouched = true"
            />
            <span class="hint">
              {{
                egg?.key_locked
                  ? 'Fixed now that it has gone live.'
                  : 'Lowercase words and dashes. It can’t change once the egg goes live.'
              }}
            </span>
          </label>
          <label>
            Lore line
            <textarea
              v-model="form.lore"
              rows="2"
              maxlength="500"
              placeholder="Optional. A draft can wait here while you think of one."
            />
          </label>

          <span class="label">When</span>
          <div class="row">
            <label>
              {{ form.singleDay ? 'Day' : 'From' }}
              <span class="pair">
                <select v-model.number="form.startDay" aria-label="Start day">
                  <option v-for="d in days(form.startMonth)" :key="d" :value="d">{{ d }}</option>
                </select>
                <select v-model.number="form.startMonth" aria-label="Start month">
                  <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
                </select>
              </span>
            </label>
            <label v-if="!form.singleDay">
              To
              <span class="pair">
                <select v-model.number="form.endDay" aria-label="End day">
                  <option v-for="d in days(form.endMonth)" :key="d" :value="d">{{ d }}</option>
                </select>
                <select v-model.number="form.endMonth" aria-label="End month">
                  <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
                </select>
              </span>
            </label>
          </div>
          <label class="check">
            <input v-model="form.singleDay" type="checkbox" /> A single day
          </label>
          <div class="row">
            <label class="check">
              <input v-model="form.onlyOneYear" type="checkbox" /> One year only (an anniversary)
            </label>
            <input
              v-if="form.onlyOneYear"
              v-model.number="form.onlyYear"
              type="number"
              min="1900"
              max="2200"
              aria-label="Year"
              class="year"
            />
          </div>
          <p class="muted">{{ whenText(body) }}</p>
          <div class="choice" role="radiogroup" aria-label="Repeat">
            <button
              v-for="r in ['yearly', 'once'] as const"
              :key="r"
              type="button"
              role="radio"
              class="small"
              :class="form.repeat === r ? 'mustard' : 'plain'"
              :aria-checked="form.repeat === r"
              @click="form.repeat = r"
            >
              {{ r === 'yearly' ? 'A stamp every year' : 'Once ever' }}
            </button>
          </div>

          <span class="label">What it matches</span>
          <div class="choice" role="radiogroup" aria-label="Match">
            <button
              v-for="k in [
                ['film', 'A film'],
                ['films', 'A list of films'],
                ['genre', 'A genre'],
                ['keyword', 'A keyword'],
              ] as const"
              :key="k[0]"
              type="button"
              role="radio"
              class="small"
              :class="form.kind === k[0] ? 'mustard' : 'plain'"
              :aria-checked="form.kind === k[0]"
              @click="form.kind = k[0]"
            >
              {{ k[1] }}
            </button>
          </div>
          <AdminFilmPicker
            v-if="form.kind === 'film' || form.kind === 'films'"
            v-model="form.films"
            :multiple="form.kind === 'films'"
            :label="form.kind === 'film' ? 'Film' : 'Add films'"
          />
          <label v-else-if="form.kind === 'genre'">
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
          <label v-if="form.kind !== 'film'">
            Different films needed in the window
            <input v-model.number="form.minCount" type="number" min="1" max="50" class="year" />
          </label>

          <span class="label">Extras</span>
          <label>
            Hint after it's found
            <input v-model="form.hint" maxlength="200" placeholder="Optional" />
          </label>
          <label>
            Notes for admins
            <textarea v-model="form.notes" rows="2" maxlength="2000" placeholder="Optional" />
          </label>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-else-if="status" class="muted" role="status">{{ status }}</p>
          <div class="actions">
            <button type="submit" :disabled="busy || Boolean(missing)" :title="missing ?? ''">
              <AppIcon name="check" :size="14" /> {{ egg ? 'Save' : 'Save as draft' }}
            </button>
            <template v-if="egg">
              <button
                v-if="egg.status !== 'live'"
                type="button"
                class="mustard"
                :disabled="busy"
                @click="enable"
              >
                <AppIcon name="egg" :size="14" /> Enable
              </button>
              <button v-else type="button" class="plain" :disabled="busy" @click="disable">
                <AppIcon name="eye-off" :size="14" /> Switch off
              </button>
              <template v-if="!egg.found">
                <button
                  v-if="!confirmDelete"
                  type="button"
                  class="danger"
                  :disabled="busy"
                  @click="confirmDelete = true"
                >
                  <AppIcon name="trash" :size="14" /> Delete
                </button>
                <span v-else class="confirm">
                  Delete for good?
                  <button type="button" class="danger small" :disabled="busy" @click="remove">
                    Delete
                  </button>
                  <button type="button" class="plain small" @click="confirmDelete = false">
                    Keep it
                  </button>
                </span>
              </template>
            </template>
          </div>
          <p v-if="missing" class="hint">{{ missing }}</p>
          <p v-if="egg && egg.status !== 'live'" class="hint">
            Enabling makes it live from that moment: only watches logged after it can find it. Saved
            changes to a live egg apply straight away.
          </p>
        </form>

        <aside class="panel stack">
          <span class="label">Test it</span>
          <p class="hint">Tests use the form as it is now, saved or not.</p>
          <button type="button" class="plain" @click="showCard">
            <AppIcon name="eye" :size="14" /> Show me the card
          </button>

          <button
            type="button"
            class="plain"
            :disabled="busy || Boolean(missing)"
            @click="runCheck"
          >
            <AppIcon name="search" :size="14" /> Check past watches
          </button>
          <template v-if="check">
            <p v-if="!check.years.length" class="muted">No logged watch would have matched.</p>
            <table v-else>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>People</th>
                  <th>Watches</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="y in check.years" :key="y.year">
                  <td>{{ y.year }}</td>
                  <td>{{ y.users }}</td>
                  <td>{{ y.watches }}</td>
                </tr>
              </tbody>
            </table>
            <p class="hint">
              Counts only. These watches don't earn it: only logs made once it's live.
            </p>
          </template>

          <span class="label">Try a log</span>
          <AdminFilmPicker v-model="tryFilm" label="Film" />
          <label>
            Watched on
            <input v-model="tryDate" type="date" />
          </label>
          <button
            type="button"
            class="plain"
            :disabled="busy || Boolean(missing) || !tryFilm.length"
            @click="runTry"
          >
            <AppIcon name="forward" :size="14" /> Try it
          </button>
          <p v-if="tried" class="result" :class="{ yes: tried.finds }">
            {{ tried.finds ? '✓' : '✗' }} {{ tried.reason }}
          </p>
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
  align-items: flex-end;
}

.pair {
  display: flex;
  gap: 0.4rem;
}

.check {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.year {
  width: 7rem;
}

.choice,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: var(--error);
}

.pill {
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  border: 2px solid var(--line);
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pill.live {
  background: var(--mustard);
  color: var(--on-mustard);
  border-color: var(--mustard);
}

table {
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

th,
td {
  padding: 0.3rem 0.8rem 0.3rem 0;
  text-align: left;
}

th {
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.result {
  margin: 0;
  font-weight: 700;
  color: var(--error);
}

.result.yes {
  color: inherit;
}

@media (min-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: start;
  }
}
</style>
