<script setup lang="ts">
import type { SetSummary } from '@/api/types'
import TicketProgress from '@/components/TicketProgress.vue'

// A set on the Sets page as a pile of tickets. `flip` leans the pile the other way, so a
// list of them looks hand-stacked.
defineProps<{ set: SetSummary; flip?: boolean }>()

const KIND_LABELS: Partial<Record<SetSummary['kind'], string>> = {
  director: 'director',
  awards: 'Oscars',
}
</script>

<template>
  <!-- A pile of tickets: the set on top, two more peeking out underneath. Alternate
       piles lean the other way so the list looks hand-stacked. -->
  <RouterLink
    class="pile"
    :class="[set.trophy, { flip }]"
    :to="{ name: 'set', params: { id: set.id } }"
  >
    <span class="under under-2" aria-hidden="true" />
    <span class="under under-1" aria-hidden="true" />
    <span class="ticket">
      <span class="main">
        <span class="set-title">{{ set.title }}</span>
        <span v-if="KIND_LABELS[set.kind]" class="kind">{{ KIND_LABELS[set.kind] }}</span>
        <TicketProgress class="holes" :watched="set.watched" :total="set.total" />
      </span>
      <span class="stub">
        <template v-if="set.watched === set.total">
          <span class="big">✓</span>
          <span class="small">all {{ set.total }}</span>
        </template>
        <template v-else>
          <span class="big">{{ set.watched }}</span>
          <span class="small">of {{ set.total }}</span>
        </template>
      </span>
    </span>
  </RouterLink>
</template>

<style scoped>
.pile {
  --stub: 4.2rem;
  position: relative;
  display: block;
  color: var(--parchment-ink);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  /* The whole pile casts one shadow, following each ticket's notch. */
  filter: var(--ticket-shadow);
}

/* Every ticket in the pile has the same punched notch, cut right through. */
.under,
.ticket {
  mask: radial-gradient(circle at 100% 50%, #0000 0.75rem, #000 calc(0.75rem + 0.5px));
}

/* The tickets underneath: same paper and red end, tilted and nudged out of line. */
.under {
  position: absolute;
  inset: 0;
  border: 2px solid var(--ticket-line);
  border-radius: 0.6rem;
  /* A faint dark wash stands in for being further down the pile. */
  background:
    linear-gradient(rgb(60 40 20 / var(--shade)), rgb(60 40 20 / var(--shade))),
    linear-gradient(to left, var(--red) var(--stub), transparent var(--stub)),
    var(--parchment-paper);
}

.under-1 {
  --shade: 0.07;
  transform: translate(3px, 5px) rotate(1.6deg);
}

.under-2 {
  --shade: 0.14;
  transform: translate(-4px, 8px) rotate(-2.2deg);
}

.flip .under-1 {
  transform: translate(-3px, 5px) rotate(-1.4deg);
}

.flip .under-2 {
  transform: translate(4px, 8px) rotate(2.4deg);
}

.ticket {
  position: relative;
  display: flex;
  min-height: 5rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.6rem;
  background: var(--parchment-paper);
  transition: transform 0.08s;
}

.pile:active .ticket {
  transform: translateY(2px);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0.5rem;
  padding: 0.7rem 0.85rem 0.8rem;
}

.set-title {
  font-family: var(--ticket-title);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.15;
}

.kind {
  padding: 0.05rem 0.4rem;
  border: 1.5px solid currentColor;
  border-radius: 0.3rem;
  font-family: var(--ticket-type);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}

.holes {
  flex-basis: 100%;
  --hole-on: var(--red);
  --hole-off: var(--parchment-muted);
}

/* Red stub with the count, the same tear line and notch as a watch ticket. */
.stub {
  width: var(--stub);
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-right: 0.5rem;
  margin: -2px -2px -2px 0;
  border-left: 2px dashed var(--ticket-line);
  border-radius: 0 0.6rem 0.6rem 0;
  background: var(--red);
  color: var(--on-red);
  font-family: var(--ticket-type);
  line-height: 1;
}

.big {
  font-size: 1.6rem;
}

.small {
  margin-top: 0.2rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-transform: uppercase;
}

/* Trophies (design.md §6.2): gold when every film is watched; silver when the set was
   completed once and a film has joined since. */
.pile {
  --stub-colour: var(--red);
  --stub-ink: var(--on-red);
}

.gold {
  --stub-colour: var(--mustard);
  --stub-ink: var(--on-mustard);
}

.silver {
  --stub-colour: #c3c7cc;
  --stub-ink: #2a1a12;
}

.gold .stub,
.silver .stub {
  background: var(--stub-colour);
  color: var(--stub-ink);
}

.gold .under,
.silver .under {
  background:
    linear-gradient(rgb(60 40 20 / var(--shade)), rgb(60 40 20 / var(--shade))),
    linear-gradient(to left, var(--stub-colour) var(--stub), transparent var(--stub)),
    var(--parchment-paper);
}
</style>
