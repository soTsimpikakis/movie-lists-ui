<script setup lang="ts">
import { ref } from 'vue'

import { post } from '@/api/client'
import type { SearchResult, Watch } from '@/api/types'
import DateField from '@/components/DateField.vue'
import PosterImage from '@/components/PosterImage.vue'
import ReactionPicker from '@/components/ReactionPicker.vue'
import { ordinal, todayIso } from '@/lib/format'

const props = defineProps<{ film: SearchResult }>()
const emit = defineEmits<{ logged: [watch: Watch]; close: [] }>()

const watchedOn = ref(todayIso())
const reaction = ref<string | null>(null)
const busy = ref(false)
const error = ref('')

async function done() {
  error.value = ''
  busy.value = true
  try {
    const watch = await post<Watch>('/watches', {
      tmdb_id: props.film.tmdb_id,
      watched_on: watchedOn.value,
      reaction: reaction.value,
    })
    emit('logged', watch)
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
      <div class="film">
        <PosterImage class="thumb" :path="film.poster_path" :title="film.title" size="w92" />
        <div>
          <h2>{{ film.title }}</h2>
          <p class="muted">
            {{ film.year ?? '' }}
            <template v-if="film.watch_count">
              · this will be your {{ ordinal(film.watch_count + 1) }} watch
            </template>
          </p>
        </div>
      </div>

      <div class="when">
        <span class="muted">Watched</span>
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
  background: rgb(0 0 0 / 0.45);
}

.sheet {
  width: 100%;
  max-width: 40rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1rem calc(1rem + env(safe-area-inset-bottom));
  border-radius: 1rem 1rem 0 0;
  background: var(--bg);
  overflow: hidden;
}

.film {
  display: flex;
  gap: 0.9rem;
  align-items: center;
}

.thumb {
  width: 4rem;
  flex: none;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.film p {
  margin: 0.2rem 0 0;
}

.when {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.done {
  font-size: 1.1rem;
  padding: 0.9rem;
}
</style>
