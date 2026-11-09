<script setup lang="ts">
// One punched hole per film in the set: filled when watched, dashed when not.
defineProps<{ watched: number; total: number }>()
</script>

<template>
  <span class="holes" role="img" :aria-label="`${watched} of ${total} films watched`">
    <span v-for="i in total" :key="i" class="hole" :class="{ on: i <= watched }" />
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
</style>
