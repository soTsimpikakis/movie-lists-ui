<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

// What a page shows when its data didn't load, instead of "Loading…" forever.
defineProps<{ message: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="load-error" role="alert">
    <p class="error">Couldn't load this: {{ message }}</p>
    <button type="button" class="plain small" @click="emit('retry')">
      <AppIcon name="forward" :size="14" /> Try again
    </button>
  </div>
</template>

<style scoped>
.load-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
</style>
