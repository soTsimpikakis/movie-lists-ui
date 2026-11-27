<script setup lang="ts" generic="T extends string">
// One choice of a few, as a row of toggle buttons (the pressed one is mustard). Plain buttons
// with aria-pressed: each is reachable with Tab and works with Enter or Space.
defineProps<{ label: string; options: readonly { value: T; label: string }[] }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="choice" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="small"
      :class="model === o.value ? 'mustard' : 'plain'"
      :aria-pressed="model === o.value"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.choice {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
