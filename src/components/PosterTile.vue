<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'

// Plain poster with title and year, for picking films (search, "Movies I've seen"), where
// telling films apart matters more than the ticket look of FilmTile.
defineProps<{
  title: string
  year: number | null
  posterPath: string | null
  /** Shows a tick over the poster. */
  checked?: boolean
  disabled?: boolean
  note?: string
}>()
</script>

<template>
  <button
    type="button"
    class="tile"
    :class="{ checked }"
    :disabled="disabled"
    :aria-pressed="checked"
  >
    <span class="poster-wrap">
      <PosterImage :path="posterPath" :title="title" />
      <span v-if="checked" class="tick"><AppIcon name="check" :size="16" /></span>
    </span>
    <span class="title">{{ title }}</span>
    <span class="meta"
      >{{ year ?? '' }}<template v-if="note"> · {{ note }}</template></span
    >
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
}

.checked :deep(.poster) {
  outline: 3px solid var(--red);
  outline-offset: -5px;
}

.tick {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 1.7rem;
  height: 1.7rem;
  display: grid;
  place-items: center;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--mustard);
  color: var(--on-mustard);
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
}
</style>
