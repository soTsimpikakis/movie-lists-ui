<script setup lang="ts">
// One punched hole per film in the set: filled when watched, dashed when not. The last
// `fresh` filled holes were punched just now and pop in.
withDefaults(defineProps<{ watched: number; total: number; fresh?: number }>(), { fresh: 0 })
</script>

<template>
  <span class="holes" role="img" :aria-label="`${watched} of ${total} films watched`">
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

@keyframes punch {
  from {
    transform: scale(0.2);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hole.fresh {
    animation: none;
  }
}
</style>
