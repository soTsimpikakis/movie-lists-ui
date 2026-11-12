<script setup lang="ts">
// One punched hole per film in the set: filled when watched, dashed when not. The last
// `fresh` filled holes were punched just now and pop in. Big sets (every Best Picture
// winner) can't fit a hole each on a phone, so they get a strip that fills up instead.
const props = withDefaults(
  defineProps<{
    watched: number
    total: number
    fresh?: number
    /** Always a strip, for small tiles where even a few holes would be specks. */
    strip?: boolean
  }>(),
  { fresh: 0 },
)

const MAX_HOLES = 24
const percent = (n: number) => `${(n / Math.max(props.total, 1)) * 100}%`
</script>

<template>
  <span
    v-if="strip || total > MAX_HOLES"
    class="strip"
    role="img"
    :aria-label="`${watched} of ${total} films watched`"
  >
    <span class="fill" :style="{ width: percent(watched - fresh) }" />
    <span
      v-if="fresh"
      class="fill fresh-fill"
      :style="{ left: percent(watched - fresh), width: percent(fresh) }"
    />
  </span>
  <span v-else class="holes" role="img" :aria-label="`${watched} of ${total} films watched`">
    <span
      v-for="i in total"
      :key="i"
      class="hole"
      :class="{ on: i <= watched, fresh: i <= watched && i > watched - fresh }"
      :style="{ '--delay': `${(i - (watched - fresh)) * 120}ms` }"
    />
  </span>
</template>

<style scoped>
.holes {
  display: flex;
  gap: 0.3rem;
}

.hole {
  flex: 1;
  height: 0.9rem;
  border: 2px dashed var(--hole-off, var(--faint));
  border-radius: 999px;
}

.hole.on {
  border: 0;
  background: var(--hole-on, var(--red));
}

.hole.fresh {
  animation: punch 0.45s var(--delay) both cubic-bezier(0.3, 1.6, 0.5, 1);
}

/* Big sets: a strip with the same dashed edge, filled as films are watched. */
.strip {
  position: relative;
  display: block;
  height: 0.9rem;
  border: 2px dashed var(--hole-off, var(--faint));
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  position: absolute;
  inset: -2px auto -2px -2px;
  background: var(--hole-on, var(--red));
}

.fresh-fill {
  transform-origin: left;
  animation: grow 0.6s 0.15s both cubic-bezier(0.3, 1.3, 0.5, 1);
}

@keyframes grow {
  from {
    transform: scaleX(0);
  }
}

@keyframes punch {
  from {
    transform: scale(0.2);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hole.fresh,
  .fresh-fill {
    animation: none;
  }
}
</style>
