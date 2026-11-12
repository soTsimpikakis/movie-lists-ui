<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'

// A film as a ticket: red top with a punched notch, the poster, then a
// "row/seat" stub with times watched (WCH) and release year (YR). The poster identifies
// the film, so the title is only in the accessible name and tooltip for now.
const props = defineProps<{
  title: string
  year: number | null
  posterPath: string | null
  watchCount?: number
  /** Greyed out: a set film you haven't watched yet (design.md §6.1). */
  muted?: boolean
  /** Shows a tick over the poster. */
  checked?: boolean
  disabled?: boolean
  /** A ribbon on the ticket's top band, e.g. "Winner". */
  badge?: string
}>()

const name = computed(() => [props.title, props.year, props.badge].filter(Boolean).join(', '))
</script>

<template>
  <button
    type="button"
    class="tile"
    :class="{ muted, checked }"
    :disabled="disabled"
    :aria-pressed="checked"
    :aria-label="name"
    :title="name"
  >
    <span class="band">
      <span v-if="badge" class="badge" aria-hidden="true">
        <AppIcon name="trophy" :size="11" /> {{ badge }}
      </span>
    </span>
    <span class="poster-wrap">
      <PosterImage :path="posterPath" :title="title" />
      <span v-if="checked" class="tick"><AppIcon name="check" :size="16" /></span>
    </span>
    <span class="seats" aria-hidden="true">
      <span class="seat">
        <span class="seat-label">WCH</span>
        <span class="seat-value">{{ String(watchCount ?? 0).padStart(2, '0') }}</span>
      </span>
      <span class="seat">
        <span class="seat-label">YR</span>
        <span class="seat-value">{{ year ?? '—' }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.tile {
  --radius: 0.6rem;
  --notch: 1.5rem;
  position: relative;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: 0 3px 0 var(--edge);
  color: var(--fg);
  text-align: left;
  font-weight: 400;
}

/* The punched notch: a page-coloured circle centred on the outer top edge, with only its
   lower half drawn, so its outline meets the ticket's border cleanly. */
.tile::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: calc(-2px - var(--notch) / 2);
  left: 50%;
  width: var(--notch);
  height: var(--notch);
  box-sizing: border-box;
  transform: translateX(-50%);
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--bg);
  clip-path: inset(50% 0 0 0);
}

.tile:disabled {
  opacity: 1;
}

.tile:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--edge);
}

.band {
  height: 2.25rem;
  flex: none;
  /* Room for a badge under the punched notch, clear of the poster. */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.25rem;
  background: var(--red);
  border-bottom: 2px solid var(--line);
  border-radius: calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0;
}

.poster-wrap {
  position: relative;
  display: block;
}

.poster-wrap :deep(.poster) {
  border-radius: 0;
}

.seats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  border-top: 2px dashed var(--line);
}

.seat {
  display: flex;
  flex-direction: column;
  padding: 0.3rem 0.45rem 0.4rem;
  font-family: var(--mono);
  line-height: 1.15;
}

.seat + .seat {
  border-left: 2px dashed var(--faint);
}

.seat-label {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.seat-value {
  font-size: 0.95rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
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

.muted .seats {
  border-top-color: var(--faint);
}

.muted :deep(.poster) {
  filter: grayscale(1) sepia(0.35);
  opacity: 0.45;
}

.checked {
  outline: 3px solid var(--red);
  outline-offset: 1px;
}

/* Gold ribbon on the band, so the winner stands out among greyed nominees without
   covering the poster. */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.4rem;
  border: 1.5px solid var(--line);
  border-radius: 0.3rem;
  background: var(--mustard);
  color: var(--on-mustard);
  font-family: var(--mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tick {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 1.7rem;
  height: 1.7rem;
  display: grid;
  place-items: center;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--mustard);
  color: var(--on-mustard);
}
</style>
