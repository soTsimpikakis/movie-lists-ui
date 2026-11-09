<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'
import { genreColours } from '@/lib/genres'

// A film as a ticket: genre-coloured top with a punched notch, poster, then the stub.
defineProps<{
  title: string
  year: number | null
  posterPath: string | null
  genre?: string | null
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
    <span
      class="band"
      :style="muted ? undefined : genreColours(genre)"
      :title="genre ?? undefined"
    />
    <span class="poster-wrap">
      <PosterImage :path="posterPath" :title="title" />
      <span v-if="checked" class="tick"><AppIcon name="check" :size="16" /></span>
    </span>
    <span class="stub">
      <span class="title">{{ title }}</span>
      <span class="meta"
        >{{ year ?? '' }}<template v-if="note"> · {{ note }}</template></span
      >
    </span>
  </button>
</template>

<style scoped>
.tile {
  position: relative;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  box-shadow: 0 3px 0 var(--edge);
  color: var(--fg);
  text-align: left;
  font-weight: 400;
}

/* The punched notch: a page-coloured circle half over the top edge. */
.tile::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: -0.7rem;
  left: 50%;
  width: 1.4rem;
  height: 1.4rem;
  transform: translateX(-50%);
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
}

.tile:disabled {
  opacity: 1;
}

.tile:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--edge);
}

.band {
  height: 1.1rem;
  flex: none;
  border-bottom: 2px solid var(--line);
}

.poster-wrap {
  position: relative;
  display: block;
  padding: 0.4rem 0.4rem 0;
}

.poster-wrap :deep(.poster) {
  border: 2px solid var(--line);
  border-radius: 0.3rem;
}

.stub {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  margin-top: 0.4rem;
  padding: 0.35rem 0.45rem 0.45rem;
  border-top: 2px dashed var(--faint);
}

.muted {
  border-style: dashed;
  border-color: var(--faint);
  background: transparent;
  box-shadow: none;
}

.muted::before {
  border-style: dashed;
  border-color: var(--faint);
}

.muted .band {
  background: repeating-linear-gradient(135deg, var(--card) 0 6px, transparent 6px 12px);
  border-bottom: 2px dashed var(--faint);
}

.muted :deep(.poster) {
  filter: grayscale(1) sepia(0.35);
  opacity: 0.45;
  border-color: var(--faint);
}

.checked {
  outline: 3px solid var(--red);
  outline-offset: 1px;
}

.tick {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
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
