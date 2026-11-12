<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'

// Plain poster with title and year, for picking films (search, "Movies I've seen"), where
// telling films apart matters more than the ticket look of FilmTile. The two ticked states
// must be obvious at a glance while scrolling: picked now gets a big SEEN stamp; already in
// the library is greyed, locked and labelled.
const props = defineProps<{
  title: string
  year: number | null
  posterPath: string | null
  /** Ticked: picked now, or (with `disabled`) already in the library. */
  checked?: boolean
  disabled?: boolean
  note?: string
  /** TMDB rating, e.g. "★ 8.4 · 37k"; on its own line so it never wraps mid-way. */
  rating?: string
}>()

const picked = computed(() => props.checked && !props.disabled)
const owned = computed(() => props.checked && props.disabled)
</script>

<template>
  <button
    type="button"
    class="tile"
    :class="{ picked, owned }"
    :disabled="disabled"
    :aria-pressed="checked"
    :aria-label="`${title}${year ? `, ${year}` : ''}${picked ? ', ticked' : ''}${owned ? ', already in your library' : ''}`"
  >
    <span class="poster-wrap">
      <PosterImage :path="posterPath" :title="title" />
      <span v-if="picked" class="stamp" aria-hidden="true">
        <AppIcon name="check" :size="16" /> Seen
      </span>
      <span v-else-if="owned" class="owned-label" aria-hidden="true">In library</span>
    </span>
    <span class="title">
      <AppIcon v-if="picked" name="check" :size="12" class="title-tick" />{{ title }}
    </span>
    <span class="meta"
      >{{ year ?? '' }}<template v-if="note"> · {{ note }}</template></span
    >
    <span v-if="rating" class="meta">{{ rating }}</span>
  </button>
</template>

<style scoped>
.tile {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0.3rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
  color: var(--fg);
  text-align: left;
  font-weight: 400;
}

.tile:disabled {
  opacity: 1;
}

.tile:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: none;
}

.poster-wrap {
  position: relative;
  display: block;
}

.poster-wrap :deep(.poster) {
  border: 2px solid var(--line);
  border-radius: 0.5rem;
  transition:
    filter 0.15s,
    opacity 0.15s;
}

/* Picked now: thick red frame, poster dimmed, a red rubber stamp across it. */
.picked .poster-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 4px solid var(--red);
  border-radius: 0.5rem;
  background: rgb(42 26 18 / 0.35);
  pointer-events: none;
}

.stamp {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.6rem;
  border: 3px solid var(--red);
  border-radius: 0.4rem;
  background: rgb(246 235 217 / 0.92);
  box-shadow:
    inset 0 0 0 2px rgb(246 235 217 / 0.92),
    inset 0 0 0 3px var(--red);
  color: var(--red);
  font-family: var(--display);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translate(-50%, -50%) rotate(-12deg);
  animation: thump 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes thump {
  from {
    transform: translate(-50%, -50%) rotate(-12deg) scale(1.6);
    opacity: 0;
  }
}

.picked .title {
  color: var(--red);
}

.title-tick {
  margin-right: 0.2rem;
  vertical-align: -0.1em;
}

/* Already in the library: faded and locked, with a label so it reads as done, not picked. */
.owned :deep(.poster) {
  filter: grayscale(1);
  opacity: 0.45;
}

.owned .title,
.owned .meta {
  opacity: 0.6;
}

.owned-label {
  position: absolute;
  left: 0.35rem;
  right: 0.35rem;
  bottom: 0.35rem;
  padding: 0.2rem 0.3rem;
  border-radius: 0.3rem;
  background: var(--fg);
  color: var(--bg);
  font-family: var(--mono);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-align: center;
  text-transform: uppercase;
}

.title {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
}

.meta {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .stamp {
    animation: none;
  }
}
</style>
