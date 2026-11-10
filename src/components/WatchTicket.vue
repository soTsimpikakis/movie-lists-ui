<script setup lang="ts">
import { computed } from 'vue'

import type { Watch } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'
import { useReactionsStore } from '@/stores/reactions'

// A watch as a cinema ticket: poster, title, the date in "row / seat" cells, a stamped heart
// for favourites, and a red stub with the ticket's serial and the reaction stamped on it.
const props = defineProps<{ watch: Watch }>()
const reactions = useReactionsStore()
const reaction = computed(() =>
  props.watch.reaction ? reactions.byKey.get(props.watch.reaction) : undefined,
)

const seats = computed(() => {
  const { watched_on: on, watch_number: n, film } = props.watch
  const cells = on
    ? [
        { label: 'YR', value: on.slice(0, 4) },
        { label: 'MO', value: on.slice(5, 7) },
        { label: 'DAY', value: on.slice(8, 10) },
      ]
    : // Before Movie Club: no date, so the release year stands in.
      [{ label: 'REL', value: film.year ? String(film.year) : '—' }]
  if (n > 1) cells.push({ label: 'WCH', value: String(n).padStart(2, '0') })
  return cells
})
const serial = computed(() => `#${String(props.watch.serial).padStart(3, '0')}`)
</script>

<template>
  <RouterLink class="watch" :to="{ name: 'watch', params: { id: watch.id } }">
    <PosterImage
      class="thumb"
      :path="watch.film.poster_path"
      :title="watch.film.title"
      size="w185"
    />
    <span class="main">
      <span class="title" :class="{ stamped: watch.film.favourite }">{{ watch.film.title }}</span>
      <span class="seats">
        <span v-for="s in seats" :key="s.label" class="seat">
          <span class="seat-label">{{ s.label }}</span>
          <span class="seat-value">{{ s.value }}</span>
        </span>
      </span>
      <span v-if="watch.film.favourite" class="stamp" role="img" aria-label="Favourite">
        <AppIcon name="heart" :size="18" filled />
        <span>fav</span>
      </span>
    </span>
    <span class="stub">
      <span class="serial" :aria-label="`Ticket ${serial}`">{{ serial }}</span>
      <span class="emoji reaction" :title="reaction?.label">{{ reaction?.emoji ?? '' }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
/* Ticket proportions: about 3:8, capped so desktop tickets don't get huge. The notch on the
   stub is a real cut-out, so the shadow and whatever lies below show through. */
.watch {
  position: relative;
  display: flex;
  align-items: stretch;
  aspect-ratio: 8 / 3;
  max-height: 9rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.6rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  text-decoration: none;
  mask: radial-gradient(circle at 100% 50%, #0000 0.9rem, #000 calc(0.9rem + 0.5px));
}

.thumb {
  width: auto;
  height: 100%;
  flex: none;
  aspect-ratio: 2 / 3;
  border-radius: calc(0.6rem - 2px) 0 0 calc(0.6rem - 2px);
  border-right: 2px solid var(--ticket-line);
}

.main {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
  padding: 0.55rem 0.75rem;
}

.title {
  font-family: var(--ticket-title);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

/* Room for the stamp in the corner. */
.title.stamped {
  padding-right: 2.6rem;
}

/* Date as "row / seat" cells, like the stub of a printed ticket. */
.seats {
  display: flex;
}

.seat {
  display: flex;
  flex-direction: column;
  padding: 0 0.6rem;
  font-family: var(--ticket-type);
  line-height: 1.1;
}

.seat:first-child {
  padding-left: 0;
}

.seat + .seat {
  border-left: 2px dashed var(--ticket-line);
}

.seat-label {
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  color: var(--parchment-muted);
}

.seat-value {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

/* A rubber-stamped heart: red ink, a double ring, pressed on at an angle. */
.stamp {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  width: 2.6rem;
  height: 2.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--red);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 2px var(--parchment),
    inset 0 0 0 3px var(--red);
  color: var(--red);
  font-family: var(--ticket-type);
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  transform: rotate(-14deg);
  opacity: 0.82;
  mix-blend-mode: multiply;
}

.stub {
  width: 4.6rem;
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.85rem 0 0.25rem;
  border-left: 2px dashed var(--ticket-line);
  background: var(--red);
  color: var(--on-red);
  /* Covers the ticket's outline, so the colour runs right to the edge. */
  margin: -2px -2px -2px 0;
  border-radius: 0 0.6rem 0.6rem 0;
}

/* The serial runs up the stub, like the number printed on a ticket's edge. */
.serial {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--ticket-type);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  opacity: 0.9;
}

.reaction {
  flex: 1;
  text-align: center;
  font-size: 1.6rem;
}
</style>
