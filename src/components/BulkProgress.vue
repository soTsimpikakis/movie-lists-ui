<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Shown while a big "Movies I've seen" save runs: tickets peel off a pile and drop into the
// ticket box, with real progress from the batches (lib/bulk.ts).
const props = defineProps<{ done: number; total: number }>()

const LINES = [
  'Punching tickets…',
  'Stamping passports…',
  'Dusting off old reels…',
  'Sorting the shelves by decade…',
  'Checking the sets for gold…',
  'Asking the projectionist…',
]
const line = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (line.value = (line.value + 1) % LINES.length), 2200)))
onBeforeUnmount(() => clearInterval(timer))

const percent = computed(() => (props.total ? Math.round((100 * props.done) / props.total) : 0))
</script>

<template>
  <div class="backdrop">
    <section class="stage" role="status" aria-live="polite">
      <div class="scene" aria-hidden="true">
        <span class="pile">
          <span class="ticket t3" />
          <span class="ticket t2" />
          <span class="ticket t1" />
          <span class="ticket flying" />
        </span>
        <span class="box"><span class="slot" /><span class="box-label">Admit</span></span>
      </div>
      <h2>Filing your tickets</h2>
      <p class="line">{{ LINES[line] }}</p>
      <span class="bar" aria-hidden="true"
        ><span class="fill" :style="{ width: `${percent}%` }"
      /></span>
      <p class="count">{{ done }} of {{ total }} films</p>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1.5rem 1rem;
  background: rgb(28 18 13 / 0.78);
}

.stage {
  width: min(100%, 21rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.4rem 1.4rem 1.6rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.9rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  text-align: center;
  filter: drop-shadow(0 10px 18px rgb(0 0 0 / 0.4));
}

/* The pile on the left, the ticket box on the right; one ticket at a time flies across. */
.scene {
  position: relative;
  width: 15rem;
  height: 8.5rem;
}

.pile {
  position: absolute;
  left: 0.5rem;
  bottom: 0.6rem;
  width: 6.5rem;
  height: 2.6rem;
}

.ticket {
  position: absolute;
  inset: 0;
  border: 2px solid var(--ticket-line);
  border-radius: 0.4rem;
  background:
    linear-gradient(to left, var(--red) 1.6rem, transparent 1.6rem), var(--parchment-paper);
  mask: radial-gradient(circle at 100% 50%, #0000 0.45rem, #000 calc(0.45rem + 0.5px));
}

.t3 {
  transform: translate(3px, 6px) rotate(3deg);
  filter: brightness(0.86);
}

.t2 {
  transform: translate(-3px, 3px) rotate(-2deg);
  filter: brightness(0.93);
}

.t1 {
  transform: rotate(1deg);
}

.flying {
  animation: fly 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* Up off the pile, over in an arc, and down into the box's slot. */
@keyframes fly {
  0% {
    transform: translate(0, 0) rotate(1deg);
    opacity: 1;
  }
  45% {
    transform: translate(4rem, -4.2rem) rotate(-14deg);
  }
  80% {
    transform: translate(7.6rem, -1.6rem) rotate(80deg) scale(0.75);
    opacity: 1;
  }
  100% {
    transform: translate(7.9rem, 0.4rem) rotate(90deg) scale(0.6);
    opacity: 0;
  }
}

.box {
  position: absolute;
  right: 0.5rem;
  bottom: 0;
  width: 5.2rem;
  height: 4.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0.5rem;
  border-radius: 0.4rem 0.4rem 0.6rem 0.6rem;
  background: var(--red);
  border: 2px solid var(--parchment-ink);
  color: var(--on-red);
}

.slot {
  position: absolute;
  top: 0.55rem;
  width: 3.4rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--parchment-ink);
}

.box-label {
  font-family: var(--display);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
}

h2 {
  margin: 0.3rem 0 0;
  font-family: var(--ticket-title);
  font-weight: 700;
  font-size: 1.35rem;
}

.line {
  margin: 0;
  min-height: 1.4em;
  font-family: var(--ticket-type);
  color: var(--parchment-muted);
}

.bar {
  width: 100%;
  height: 0.6rem;
  margin-top: 0.3rem;
  border-radius: 999px;
  background: rgb(120 80 30 / 0.2);
  overflow: hidden;
}

.fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--red);
  transition: width 0.4s ease;
}

.count {
  margin: 0;
  font-family: var(--ticket-type);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
}

@media (prefers-reduced-motion: reduce) {
  .flying {
    animation: none;
    opacity: 0;
  }
}
</style>
