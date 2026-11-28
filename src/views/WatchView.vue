<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, del, errorText, patch, put } from '@/api/client'
import type { SetSummary, Watch } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import DateField from '@/components/DateField.vue'
import PosterImage from '@/components/PosterImage.vue'
import ReactionPicker from '@/components/ReactionPicker.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { ordinal } from '@/lib/format'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const watch = ref<Watch | null>(null)
// The sets this film is in, with the user's progress in each (ideabox "Showing which sets a
// watch belongs to"). Extra: if it fails to load the page just goes without it.
const sets = ref<SetSummary[]>([])
const notFound = ref(false)
const note = ref('')
const status = ref('')
const { run, error } = useAsyncAction()

onMounted(async () => {
  try {
    watch.value = await api<Watch>(`/watches/${id}`)
    note.value = watch.value.note ?? ''
  } catch {
    notFound.value = true
    return
  }
  try {
    sets.value = await api<SetSummary[]>(`/sets?film_id=${watch.value.film.id}`)
  } catch {
    sets.value = []
  }
})

/** "James Bond · Sean Connery" for a set inside a group, its own title otherwise. */
const setName = (s: SetSummary) =>
  s.section && s.group_title ? `${s.group_title} · ${s.label ?? s.title}` : s.title

const complete = (s: SetSummary) => s.total > 0 && s.watched === s.total

const save = (changes: Partial<Pick<Watch, 'watched_on' | 'reaction' | 'note'>>) =>
  run(async () => {
    watch.value = await patch<Watch>(`/watches/${id}`, changes)
    status.value = 'Saved'
    setTimeout(() => (status.value = ''), 1500)
  })

function saveNote() {
  if (watch.value && note.value.trim() !== (watch.value.note ?? '')) save({ note: note.value })
}

async function toggleFavourite() {
  if (!watch.value) return
  const film = watch.value.film
  const next = !film.favourite
  film.favourite = next
  try {
    await (next ? put : del)(`/films/${film.id}/favourite`)
  } catch (e) {
    film.favourite = !next
    error.value = errorText(e)
  }
}

async function remove() {
  if (!watch.value || !confirm(`Remove this watch of ${watch.value.film.title}?`)) return
  await del(`/watches/${id}`)
  await router.replace({ name: 'home' })
}
</script>

<template>
  <main class="page">
    <RouterLink :to="{ name: 'home' }" class="button-link plain small back">
      <AppIcon name="back" :size="14" /> Watched
    </RouterLink>

    <p v-if="notFound" class="muted">This watch doesn't exist (any more).</p>
    <template v-else-if="watch">
      <div class="film">
        <PosterImage
          class="poster"
          :path="watch.film.poster_path"
          :title="watch.film.title"
          size="w342"
        />
        <div class="film-info">
          <h1>{{ watch.film.title }}</h1>
          <p class="meta">
            {{
              [watch.film.year, watch.film.runtime_min && `${watch.film.runtime_min} min`]
                .filter(Boolean)
                .join(' · ')
            }}
          </p>
          <p class="muted">{{ watch.film.genres.join(', ') }}</p>
          <button
            class="small"
            :class="{ plain: !watch.film.favourite }"
            :aria-pressed="watch.film.favourite"
            @click="toggleFavourite"
          >
            <AppIcon name="heart" :size="14" :filled="watch.film.favourite" />
            {{ watch.film.favourite ? 'Favourite' : 'Add to favourites' }}
          </button>
        </div>
      </div>

      <section v-if="sets.length" class="sets" aria-labelledby="sets-label">
        <span id="sets-label" class="label">In these sets</span>
        <div class="set-buttons">
          <RouterLink
            v-for="s in sets"
            :key="s.id"
            :to="{ name: 'set', params: { id: s.id } }"
            class="button-link small"
            :class="complete(s) ? 'mustard' : 'plain'"
          >
            {{ setName(s) }}
            <span class="count">{{ complete(s) ? '✓' : `${s.watched}/${s.total}` }}</span>
          </RouterLink>
        </div>
      </section>

      <div class="stack">
        <div class="row">
          <span class="label">Watched</span>
          <DateField
            v-if="watch.watched_on"
            :model-value="watch.watched_on"
            @update:model-value="(d: string) => save({ watched_on: d })"
          />
          <span v-else class="before">before Movie Club</span>
          <span v-if="watch.watch_number > 1" class="nth">
            {{ ordinal(watch.watch_number) }} watch
          </span>
        </div>

        <ReactionPicker
          :model-value="watch.reaction"
          @update:model-value="(r) => save({ reaction: r })"
        />

        <label>
          <span class="label">Private note</span>
          <textarea
            v-model="note"
            rows="4"
            maxlength="5000"
            placeholder="Only you can see this."
            @blur="saveNote"
          />
        </label>

        <p class="status" aria-live="polite">
          <span v-if="error" class="error">{{ error }}</span>
          <span v-else class="muted">{{ status }}</span>
        </p>

        <button class="danger small remove" @click="remove">
          <AppIcon name="trash" :size="14" /> Remove this watch
        </button>
      </div>
    </template>

    <TmdbCredit />
  </main>
</template>

<style scoped>
.back {
  margin-bottom: 1.25rem;
}

.film {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.poster {
  width: 7.5rem;
  flex: none;
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  box-shadow: 0 4px 0 var(--edge);
}

.film-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.film-info p {
  margin: 0;
}

.meta {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--muted);
}

.film-info button {
  margin-top: 0.4rem;
}

.sets {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.set-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.count {
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 500;
}

.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 2px dashed var(--faint);
}

.before {
  font-family: var(--mono);
  color: var(--muted);
}

.nth {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--red);
}

textarea {
  resize: vertical;
}

textarea::placeholder {
  color: var(--faint);
}

.status {
  min-height: 1.5rem;
  margin: 0;
}

.remove {
  align-self: flex-start;
}
</style>
