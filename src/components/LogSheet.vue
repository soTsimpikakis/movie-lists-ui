<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import { post } from '@/api/client'
import type { LoggedWatch, SearchResult, Watch } from '@/api/types'
import DateField from '@/components/DateField.vue'
import PosterImage from '@/components/PosterImage.vue'
import ReactionPicker from '@/components/ReactionPicker.vue'
import { ordinal, todayIso } from '@/lib/format'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { useRewardsStore } from '@/stores/rewards'

const props = defineProps<{ film: SearchResult }>()
const emit = defineEmits<{ logged: [watch: Watch]; close: [] }>()
const rewards = useRewardsStore()
const sheet = useTemplateRef<HTMLElement>('sheet')
useDialogFocus(sheet, true, () => emit('close'))

const watchedOn = ref(todayIso())
// No date: a library add ("before Movie Club"), for someone who meant "I've seen this" rather
// than a new watch. Only for a film not yet in the library: it can be back-filled once.
const undated = ref(false)
const canUndate = !props.film.watch_count
const reaction = ref<string | null>(null)
const { run, busy, error } = useAsyncAction()

const done = () =>
  run(async () => {
    const { events, ...watch } = await post<LoggedWatch>('/watches', {
      tmdb_id: props.film.tmdb_id,
      watched_on: undated.value ? null : watchedOn.value,
      reaction: undated.value ? null : reaction.value,
    })
    emit('logged', watch)
    rewards.push(events)
  })
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section
      ref="sheet"
      class="sheet"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      :aria-label="`Log ${film.title}`"
    >
      <span class="admit">Admit one</span>

      <div class="film">
        <PosterImage class="thumb" :path="film.poster_path" :title="film.title" size="w92" />
        <div>
          <h2>{{ film.title }}</h2>
          <p class="muted">
            {{ film.year ?? '' }}
            <template v-if="film.watch_count">
              · this will be your <strong>{{ ordinal(film.watch_count + 1) }} watch</strong>
            </template>
          </p>
        </div>
      </div>

      <div class="when">
        <span class="label">Watched</span>
        <template v-if="!undated">
          <DateField v-model="watchedOn" />
          <button v-if="canUndate" type="button" class="plain small undate" @click="undated = true">
            No date
          </button>
        </template>
        <template v-else>
          <span class="before">
            <strong>Before Movie Club</strong>
            <span class="muted">Goes to your Library, not the diary</span>
          </span>
          <button type="button" class="plain small undate" @click="undated = false">
            Add a date
          </button>
        </template>
      </div>

      <!-- A library add takes no reaction, like the Library's own adds. -->
      <ReactionPicker v-if="!undated" v-model="reaction" />

      <p v-if="error" class="error">{{ error }}</p>
      <button class="done" :disabled="busy" @click="done">
        {{ undated ? 'Add to library' : 'Done' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  /* Over the sticky tabs (10) and the Find a film dialog (12). */
  z-index: 14;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(42 26 18 / 0.6);
}

/* A ticket torn off the roll: perforated top edge. */
.sheet {
  width: 100%;
  max-width: 40rem;
  max-height: 92dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.6rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
  border-radius: 1.1rem 1.1rem 0 0;
  background: var(--bg);
  mask: radial-gradient(circle 7px at 50% 0, #0000 97%, #000) 0 0 / 22px 100% repeat-x;
}

.admit {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--red);
}

.film {
  display: flex;
  gap: 0.9rem;
  align-items: center;
}

.thumb {
  width: 4.4rem;
  flex: none;
  border: 2px solid var(--line);
}

h2 {
  margin: 0;
  font-size: 1.4rem;
}

.film p {
  margin: 0.25rem 0 0;
}

.film strong {
  color: var(--red);
}

.when {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-block: 2px dashed var(--faint);
}

.undate {
  margin-left: auto;
}

.before {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.before .muted {
  font-size: 0.85rem;
}

.done {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.25rem;
  padding: 0.9rem;
  border-radius: 0.75rem;
  box-shadow: 0 5px 0 var(--edge);
}
</style>
