<script setup lang="ts">
import { ref } from 'vue'

import { post } from '@/api/client'
import type { LoggedWatch, SearchResult, Watch } from '@/api/types'
import DateField from '@/components/DateField.vue'
import PosterImage from '@/components/PosterImage.vue'
import ReactionPicker from '@/components/ReactionPicker.vue'
import { ordinal, todayIso } from '@/lib/format'
import { useRewardsStore } from '@/stores/rewards'

const props = defineProps<{ film: SearchResult }>()
const emit = defineEmits<{ logged: [watch: Watch]; close: [] }>()
const rewards = useRewardsStore()

const watchedOn = ref(todayIso())
const reaction = ref<string | null>(null)
const busy = ref(false)
const error = ref('')

async function done() {
  error.value = ''
  busy.value = true
  try {
    const { events, ...watch } = await post<LoggedWatch>('/watches', {
      tmdb_id: props.film.tmdb_id,
      watched_on: watchedOn.value,
      reaction: reaction.value,
    })
    emit('logged', watch)
    rewards.push(events)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="`Log ${film.title}`">
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
        <DateField v-model="watchedOn" />
      </div>

      <ReactionPicker v-model="reaction" />

      <p v-if="error" class="error">{{ error }}</p>
      <button class="done" :disabled="busy" @click="done">Done</button>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
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

.done {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.25rem;
  padding: 0.9rem;
  border-radius: 0.75rem;
  box-shadow: 0 5px 0 var(--edge);
}
</style>
