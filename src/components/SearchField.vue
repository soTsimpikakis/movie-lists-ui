<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{ placeholder: string; label: string }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="search-field">
    <AppIcon name="search" :size="18" />
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      enterkeyhint="search"
      autocomplete="off"
      :aria-label="label"
    />
  </label>
</template>

<style scoped>
.search-field {
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.85rem;
  border: 2px dashed var(--line);
  border-radius: 0.6rem;
  background: var(--card);
}

.search-field:focus-within {
  border-style: solid;
  outline: 3px solid var(--mustard);
  outline-offset: 1px;
}

input {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 0;
  border: 0;
  background: transparent;
  outline: none;
}

input::placeholder {
  color: var(--faint);
}
</style>
