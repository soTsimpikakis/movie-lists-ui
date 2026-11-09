<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'

defineProps<{
  title: string
  year: number | null
  posterPath: string | null
  /** Greyed out: a set film you haven't watched yet (design.md §6.1). */
  muted?: boolean
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
    :class="{ muted, checked }"
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
  gap: 0.3rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
  color: var(--fg);
  text-align: left;
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

.muted :deep(.poster) {
  filter: grayscale(1) sepia(0.35);
  opacity: 0.45;
  border-style: dashed;
  border-color: var(--faint);
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
