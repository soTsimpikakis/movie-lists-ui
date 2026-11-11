<script setup lang="ts">
import { computed } from 'vue'

import { countryName } from '@/lib/journey'

// A passport stamp for a country: double ring, code in the middle, name around it, pressed
// on slightly crooked (the tilt comes from `tilt`, so a page of stamps looks hand-stamped).
const props = withDefaults(defineProps<{ code: string; tilt?: number; small?: boolean }>(), {
  tilt: -8,
  small: false,
})
const name = computed(() => countryName(props.code))
</script>

<template>
  <span
    class="stamp"
    :class="{ small }"
    role="img"
    :aria-label="`Passport stamp: ${name}`"
    :style="{ transform: `rotate(${tilt}deg)` }"
  >
    <span class="code">{{ code }}</span>
    <span v-if="!small" class="name">{{ name }}</span>
  </span>
</template>

<style scoped>
.stamp {
  --size: 5.6rem;
  width: var(--size);
  height: var(--size);
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.5rem;
  border: 3px solid var(--stamp-ink, var(--red));
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 3px var(--stamp-paper, var(--parchment)),
    inset 0 0 0 5px var(--stamp-ink, var(--red));
  color: var(--stamp-ink, var(--red));
  text-align: center;
  opacity: 0.88;
}

.stamp.small {
  --size: 2.6rem;
  padding: 0;
  border-width: 2px;
  box-shadow:
    inset 0 0 0 2px var(--stamp-paper, var(--parchment)),
    inset 0 0 0 3px var(--stamp-ink, var(--red));
}

.code {
  font-family: var(--display);
  font-size: 1.35rem;
  line-height: 1;
}

.small .code {
  font-size: 0.8rem;
}

.name {
  max-width: 100%;
  font-family: var(--ticket-type);
  font-size: 0.6rem;
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
