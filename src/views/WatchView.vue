<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, del, patch, put } from '@/api/client'
import type { Watch } from '@/api/types'
import DateField from '@/components/DateField.vue'
import PosterImage from '@/components/PosterImage.vue'
import ReactionPicker from '@/components/ReactionPicker.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { ordinal } from '@/lib/format'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const watch = ref<Watch | null>(null)
const notFound = ref(false)
const note = ref('')
const status = ref('')
const error = ref('')

onMounted(async () => {
  try {
    watch.value = await api<Watch>(`/watches/${id}`)
    note.value = watch.value.note ?? ''
  } catch {
    notFound.value = true
  }
})

async function save(changes: Partial<Pick<Watch, 'watched_on' | 'reaction' | 'note'>>) {
  error.value = ''
  try {
    watch.value = await patch<Watch>(`/watches/${id}`, changes)
    status.value = 'Saved'
    setTimeout(() => (status.value = ''), 1500)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

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
    error.value = e instanceof Error ? e.message : String(e)
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
    <RouterLink :to="{ name: 'home' }" class="back">← Watched</RouterLink>

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
          <p class="muted">
            {{
              [watch.film.year, watch.film.runtime_min && `${watch.film.runtime_min} min`]
                .filter(Boolean)
                .join(' · ')
            }}
          </p>
          <p class="muted">{{ watch.film.genres.join(', ') }}</p>
          <button
            class="heart"
            :class="{ on: watch.film.favourite }"
            :aria-pressed="watch.film.favourite"
            @click="toggleFavourite"
          >
            {{ watch.film.favourite ? '♥ Favourite' : '♡ Favourite' }}
          </button>
        </div>
      </div>

      <div class="stack">
        <div class="row">
          <span class="muted">Watched</span>
          <DateField
            v-if="watch.watched_on"
            :model-value="watch.watched_on"
            @update:model-value="(d: string) => save({ watched_on: d })"
          />
          <span v-else>before Movie Club</span>
          <span v-if="watch.watch_number > 1" class="muted">
            · {{ ordinal(watch.watch_number) }} watch
          </span>
        </div>

        <div>
          <h2>How was it?</h2>
          <ReactionPicker
            layout="grid"
            :model-value="watch.reaction"
            @update:model-value="(r) => save({ reaction: r })"
          />
        </div>

        <label>
          Private note
          <textarea v-model="note" rows="4" maxlength="5000" @blur="saveNote" />
        </label>

        <p class="status" aria-live="polite">
          <span v-if="error" class="error">{{ error }}</span>
          <span v-else class="muted">{{ status }}</span>
        </p>

        <button class="remove" @click="remove">Remove this watch</button>
      </div>
    </template>

    <TmdbCredit />
  </main>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1rem;
  text-decoration: none;
}

.film {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.poster {
  width: 7.5rem;
  flex: none;
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
}

h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.film-info p {
  margin: 0 0 0.25rem;
}

.heart {
  margin-top: 0.5rem;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  padding: 0.4rem 0.8rem;
}

.heart.on {
  background: var(--accent);
  color: #fff;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

textarea {
  font: inherit;
  font-size: max(1rem, 16px);
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font-weight: 400;
  resize: vertical;
}

.status {
  min-height: 1.5rem;
  margin: 0;
}

.remove {
  align-self: flex-start;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
}
</style>
