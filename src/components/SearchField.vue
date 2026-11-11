<script setup lang="ts">
import { ref } from 'vue'

import AppIcon from '@/components/AppIcon.vue'

defineProps<{ placeholder: string; label: string }>()
const model = defineModel<string>({ required: true })
const input = ref<HTMLInputElement>()

// Clearing keeps focus in the box, so search → clear → search again is quick (onboarding).
function clear() {
  model.value = ''
  input.value?.focus()
}
</script>

<template>
  <div class="search-field">
    <AppIcon name="search" :size="18" />
    <input
      ref="input"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      enterkeyhint="search"
      autocomplete="off"
      :aria-label="label"
      @keydown.esc="clear"
    />
    <button v-if="model" type="button" class="clear" aria-label="Clear search" @click="clear">
      <AppIcon name="close" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.5rem 0 0.85rem;
  border: 2px dashed var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  cursor: text;
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

/* Our own clear button replaces the browser's, which only some browsers draw. */
input::-webkit-search-cancel-button {
  appearance: none;
}

.clear {
  flex: none;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: 50%;
  background: var(--fg);
  color: var(--bg);
  box-shadow: none;
}
</style>
