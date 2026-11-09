<script setup lang="ts">
import { onMounted } from 'vue'

import { useReactionsStore } from '@/stores/reactions'

withDefaults(defineProps<{ layout?: 'row' | 'grid' }>(), { layout: 'row' })
const model = defineModel<string | null>({ required: true })
const reactions = useReactionsStore()

onMounted(reactions.load)

function toggle(key: string) {
  model.value = model.value === key ? null : key
}
</script>

<template>
  <div class="reactions" :class="layout" role="group" aria-label="Reaction">
    <button
      v-for="r in reactions.all"
      :key="r.key"
      type="button"
      class="chip"
      :class="{ selected: model === r.key }"
      :aria-pressed="model === r.key"
      @click="toggle(r.key)"
    >
      <span class="emoji">{{ r.emoji }}</span> {{ r.label }}
    </button>
  </div>
</template>

<style scoped>
.reactions {
  display: flex;
  gap: 0.4rem;
}

.reactions.row {
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -1rem;
  padding: 0 1rem;
}

.reactions.grid {
  flex-wrap: wrap;
}

.chip {
  flex: none;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--fg);
  font-weight: 400;
  white-space: nowrap;
}

.chip.selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.emoji {
  font-size: 1.1em;
}
</style>
