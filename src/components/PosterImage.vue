<script setup lang="ts">
import { computed } from 'vue'

import { posterUrl } from '@/lib/format'

const props = withDefaults(
  defineProps<{ path: string | null; title: string; size?: 'w92' | 'w185' | 'w342' }>(),
  { size: 'w185' },
)
const src = computed(() => posterUrl(props.path, props.size))
</script>

<template>
  <img v-if="src" class="poster" :src="src" :alt="title" loading="lazy" />
  <div v-else class="poster poster-missing" role="img" :aria-label="title">
    <span>{{ title }}</span>
  </div>
</template>

<style scoped>
.poster {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 0.4rem;
  background: var(--border);
}

.poster-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
