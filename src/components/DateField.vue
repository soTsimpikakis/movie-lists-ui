<script setup lang="ts">
import { formatDate, todayIso } from '@/lib/format'

// Native date pickers format by browser locale; we always show DD-MM-YYYY (design.md §5.1).
// An invisible native input sits on top of the label, so a tap opens the real picker on
// every phone; showPicker() covers desktop browsers that only open it from the icon.
const model = defineModel<string>({ required: true })

function openPicker(event: MouseEvent) {
  try {
    ;(event.currentTarget as HTMLInputElement).showPicker()
  } catch {
    // Not supported or not allowed; the native input still works.
  }
}

function onInput(event: Event) {
  // iOS offers "Clear"; a watch always has a date, so ignore empty values.
  const value = (event.target as HTMLInputElement).value
  if (value) model.value = value
}
</script>

<template>
  <label class="date-field">
    <span class="date-label">{{ formatDate(model) }}</span>
    <input
      :value="model"
      class="date-input"
      type="date"
      :max="todayIso()"
      required
      aria-label="Date watched"
      @click="openPicker"
      @input="onInput"
    />
  </label>
</template>

<style scoped>
.date-field {
  position: relative;
  display: inline-block;
}

.date-label {
  display: inline-block;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.date-input {
  position: absolute;
  inset: 0;
  width: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
