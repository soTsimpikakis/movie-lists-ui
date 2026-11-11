<script setup lang="ts">
import { LEVEL_NAMES } from '@/lib/journey'

// Five punched pips, one per level (Novice → Legend). `fresh` makes the newest one pop in.
withDefaults(defineProps<{ level: number; fresh?: boolean }>(), { fresh: false })
</script>

<template>
  <span
    class="pips"
    role="img"
    :aria-label="level ? `Level ${level}: ${LEVEL_NAMES[level - 1]}` : 'No level yet'"
  >
    <span
      v-for="i in LEVEL_NAMES.length"
      :key="i"
      class="pip"
      :class="{ on: i <= level, fresh: fresh && i === level }"
    />
  </span>
</template>

<style scoped>
.pips {
  display: inline-flex;
  gap: 0.25rem;
}

.pip {
  width: 0.8rem;
  height: 0.8rem;
  border: 2px dashed var(--pip-off, var(--faint));
  border-radius: 50%;
}

.pip.on {
  border: 0;
  background: var(--pip-on, var(--red));
}

.pip.fresh {
  animation: punch 0.5s 0.15s both cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes punch {
  from {
    transform: scale(0.2);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pip.fresh {
    animation: none;
  }
}
</style>
