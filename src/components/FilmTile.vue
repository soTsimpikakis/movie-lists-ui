<script setup lang="ts">
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
      <span v-if="checked" class="tick" aria-hidden="true">✓</span>
    </span>
    <span class="title">{{ title }}</span>
    <span class="meta"
      >{{ year ?? '' }}<template v-if="note"> · {{ note }}</template></span
    >
  </button>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  padding: 0;
  background: none;
  color: var(--fg);
  text-align: left;
  font-weight: 400;
}

.tile:disabled {
  opacity: 1;
  cursor: default;
}

.poster-wrap {
  position: relative;
  display: block;
}

.muted :deep(.poster) {
  filter: grayscale(1);
  opacity: 0.4;
}

.checked :deep(.poster) {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.tick {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 1.6rem;
  height: 1.6rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

.title {
  font-size: 0.85rem;
  line-height: 1.25;
}

.meta {
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
