<script setup lang="ts">
import { computed } from 'vue'

import type { Watch } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import PosterImage from '@/components/PosterImage.vue'
import { useReactionsStore } from '@/stores/reactions'

// A watch as a cinema ticket: poster, title, the date in "row / seat" cells, the reaction
// typed underneath, a stamped heart for favourites, and a red stub with the ticket's serial.
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
      <span v-if="reaction" class="reaction">
        <span class="emoji">{{ reaction.emoji }}</span>
        {{ reaction.label }}
      </span>
      <span v-if="watch.film.favourite" class="stamp" role="img" aria-label="Favourite">
        <AppIcon name="heart" :size="18" filled />
        <span>fav</span>
      </span>
    </span>
    <span class="stub">
      <span class="serial" :aria-label="`Ticket ${serial}`">{{ serial }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
/* Ticket proportions: about 3:8 on a phone. The height is capped directly (not through an
   aspect ratio, which would shrink the width too), so a ticket always fills its column. The
   notch on the stub is a real cut-out, so the shadow and whatever lies below show through. */
.watch {
  position: relative;
  display: flex;
  align-items: stretch;
  height: clamp(7.5rem, 37.5vw, 9rem);
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
  padding: 0.6rem 0.9rem;
}

.title {
  font-family: var(--ticket-title);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
  /* Long titles stop at two lines rather than pushing the date off the ticket. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
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
  gap: 0.15rem;
  padding: 0 0.75rem;
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

/* The reaction, typed under the date in the same face as the seats. */
.reaction {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--ticket-type);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--parchment-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reaction .emoji {
  font-size: 1.05rem;
  color: var(--parchment-ink);
}

.stub {
  width: 3.4rem;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 0.9rem;
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
  font-size: 0.95rem;
  letter-spacing: 0.16em;
}

/* Wider tickets (tablet, desktop columns) have room to breathe. */
@media (min-width: 600px) {
  .watch {
    height: 10.75rem;
  }

  .main {
    gap: 0.7rem;
    padding: 0.8rem 1.4rem;
  }

  .title {
    font-size: 1.2rem;
  }

  .seat {
    padding: 0 1.1rem;
  }

  .seat-value {
    font-size: 1.15rem;
  }

  .reaction {
    font-size: 0.85rem;
  }
}
</style>
