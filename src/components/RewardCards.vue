<script setup lang="ts">
import { computed, ref } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import LevelPips from '@/components/LevelPips.vue'
import PassportStamp from '@/components/PassportStamp.vue'
import TicketProgress from '@/components/TicketProgress.vue'
import { decadeLabel } from '@/lib/journey'
import { rewardCopy } from '@/lib/rewardCopy'
import { useRewardsStore } from '@/stores/rewards'

// The moment after Done (design.md §6.3): one ticket per change, stacked. Celebrate plays a
// short burst and moves on; Hooray for all clears the pile, so it's never a chore.
const rewards = useRewardsStore()
const current = computed(() => rewards.queue[0])
const copy = computed(() => current.value && rewardCopy(current.value))

// The current card, narrowed to the kind of event it shows.
const setEvent = computed(() => {
  const e = current.value
  return e && 'set_id' in e ? e : null
})
const levelEvent = computed(() => {
  const e = current.value
  return e && (e.kind === 'genre_level' || e.kind === 'decade_level') ? e : null
})
const stamp = computed(() => {
  const e = current.value
  return e?.kind === 'country_stamp' ? e : null
})
const summary = computed(() => {
  const e = current.value
  return e?.kind === 'journey_summary' ? e : null
})
const icon = computed(() => {
  if (current.value?.kind === 'set_progressed') return 'sparkle'
  if (stamp.value || summary.value) return 'globe'
  return 'trophy'
})
const celebrating = ref(false)
const confetti = Array.from({ length: 24 }, (_, i) => ({
  angle: (360 / 24) * i + (i % 3) * 7,
  distance: 90 + (i % 4) * 30,
  colour: ['var(--red)', 'var(--mustard)', 'var(--parchment)', '#f6ebd9'][i % 4],
}))

function celebrate() {
  if (celebrating.value) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  celebrating.value = true
  setTimeout(
    () => {
      celebrating.value = false
      rewards.next()
    },
    reduced ? 0 : 750,
  )
}
</script>

<template>
  <div v-if="current && copy" class="backdrop">
    <section class="stage" role="dialog" aria-modal="true" :aria-label="copy.label">
      <div class="pile">
        <span v-if="rewards.queue.length > 2" class="under under-2" aria-hidden="true" />
        <span v-if="rewards.queue.length > 1" class="under under-1" aria-hidden="true" />
        <article
          :key="`${current.kind}-${rewards.queue.length}`"
          class="card"
          :class="[current.kind, { leaving: celebrating }]"
        >
          <header class="band">
            <AppIcon :name="icon" :size="18" />
            <span>{{ copy.label }}</span>
          </header>
          <div class="body">
            <PassportStamp v-if="stamp" class="hero-stamp" :code="stamp.subject" :tilt="-10" />
            <h2>{{ copy.headline }}</h2>
            <template v-if="setEvent">
              <p v-if="setEvent.kind !== 'set_progressed'" class="set-name">{{ setEvent.title }}</p>
              <TicketProgress
                class="holes"
                :watched="setEvent.watched"
                :total="setEvent.total"
                :fresh="setEvent.new_films.length"
              />
            </template>
            <LevelPips v-else-if="levelEvent" class="pips" :level="levelEvent.level" fresh />
            <template v-else-if="summary">
              <span v-if="summary.stamps.length" class="mini-stamps">
                <PassportStamp
                  v-for="(code, i) in summary.stamps.slice(0, 8)"
                  :key="code"
                  :code="code"
                  :tilt="(i % 3) * 7 - 7"
                  small
                />
                <span v-if="summary.stamps.length > 8" class="more">
                  +{{ summary.stamps.length - 8 }}
                </span>
              </span>
              <span class="chips">
                <span v-for="g in summary.genre_levels" :key="`g-${g.subject}`" class="chip">
                  {{ g.subject }} · {{ g.level_name }}
                </span>
                <span v-for="d in summary.decade_levels" :key="`d-${d.subject}`" class="chip">
                  {{ decadeLabel(d.subject) }} · {{ d.level_name }}
                </span>
              </span>
            </template>
            <p class="text">{{ copy.body }}</p>
          </div>
        </article>
        <span v-if="celebrating" class="burst" aria-hidden="true">
          <span
            v-for="(c, i) in confetti"
            :key="i"
            class="bit"
            :style="{
              '--angle': `${c.angle}deg`,
              '--distance': `${c.distance}px`,
              background: c.colour,
            }"
          />
        </span>
      </div>

      <div class="actions">
        <button class="mustard celebrate" :disabled="celebrating" @click="celebrate">
          <AppIcon name="sparkle" /> Celebrate
        </button>
        <button v-if="rewards.queue.length > 1" class="plain" @click="rewards.clear()">
          Hooray for all ({{ rewards.queue.length }})
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 1.5rem 1rem;
  background: rgb(28 18 13 / 0.72);
}

.stage {
  width: min(100%, 22rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pile {
  position: relative;
  /* On the pile, not the card: a mask would clip the card's own shadow. */
  filter: drop-shadow(0 8px 14px rgb(0 0 0 / 0.35));
}

.card,
.under {
  border: 2px solid var(--ticket-line);
  border-radius: 0.8rem;
  background: var(--parchment-paper);
  /* A punched notch on each side, like a ticket's tear-off line. */
  mask:
    radial-gradient(circle at 0 62%, #0000 0.8rem, #000 calc(0.8rem + 0.5px)) left / 51% 100%
      no-repeat,
    radial-gradient(circle at 100% 62%, #0000 0.8rem, #000 calc(0.8rem + 0.5px)) right / 51% 100%
      no-repeat;
}

.under {
  position: absolute;
  inset: 0;
}

.under-1 {
  transform: translate(6px, 8px) rotate(3deg);
  filter: brightness(0.92);
}

.under-2 {
  transform: translate(-6px, 12px) rotate(-4deg);
  filter: brightness(0.84);
}

.card {
  position: relative;
  color: var(--parchment-ink);
  animation: deal 0.35s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}

.card.leaving {
  animation: fly 0.75s cubic-bezier(0.5, 0, 0.8, 0.4) forwards;
}

@keyframes deal {
  from {
    transform: translateY(40px) rotate(-6deg) scale(0.9);
    opacity: 0;
  }
}

@keyframes fly {
  30% {
    transform: scale(1.06) rotate(-2deg);
  }
  to {
    transform: translate(120%, -30%) rotate(24deg);
    opacity: 0;
  }
}

.band {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem;
  border-bottom: 2px dashed var(--ticket-line);
  border-radius: calc(0.8rem - 2px) calc(0.8rem - 2px) 0 0;
  background: var(--red);
  color: var(--on-red);
  font-family: var(--ticket-type);
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.set_completed .band,
.set_polished .band {
  background: var(--mustard);
  color: var(--on-mustard);
}

.body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 1.4rem 1.4rem 1.5rem;
  text-align: center;
}

h2 {
  margin: 0;
  font-family: var(--ticket-title);
  font-weight: 700;
  font-size: 1.6rem;
}

.set-name {
  margin: -0.4rem 0 0;
  font-family: var(--ticket-type);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--parchment-muted);
}

.holes {
  width: 100%;
  --hole-on: var(--red);
  --hole-off: var(--parchment-muted);
}

.set_completed .holes,
.set_polished .holes {
  --hole-on: var(--mustard);
}

/* Journey cards: levels show five pips; stamps and the bulk summary are passport-ink dark. */
.pips {
  --pip-on: var(--red);
  --pip-off: var(--parchment-muted);
  transform: scale(1.4);
  margin: 0.3rem 0;
}

.country_stamp .band,
.journey_summary .band {
  background: var(--parchment-ink);
  color: var(--parchment);
}

.hero-stamp {
  --stamp-paper: var(--parchment);
  margin-bottom: 0.2rem;
}

.mini-stamps {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  --stamp-paper: var(--parchment);
}

.more {
  font-family: var(--ticket-type);
  color: var(--parchment-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.chip {
  padding: 0.15rem 0.55rem;
  border: 1.5px solid var(--red);
  border-radius: 999px;
  font-family: var(--ticket-type);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--red);
}

.text {
  margin: 0;
  line-height: 1.45;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.celebrate {
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.15rem;
  padding: 0.85rem;
}

/* Confetti: little paper bits fired outward from the card's centre. */
.burst {
  position: absolute;
  left: 50%;
  top: 45%;
  z-index: 2;
  pointer-events: none;
}

.bit {
  position: absolute;
  width: 0.55rem;
  height: 0.9rem;
  border-radius: 2px;
  animation: pop 0.75s ease-out forwards;
}

@keyframes pop {
  from {
    transform: rotate(var(--angle)) translateY(0) rotate(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  to {
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--distance))) rotate(540deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card.leaving,
  .bit {
    animation: none;
  }
}
</style>
