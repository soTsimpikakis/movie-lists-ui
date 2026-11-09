<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import { useReactionsStore } from '@/stores/reactions'

// Compact on purpose (design.md §6.4): one button with the current reaction, which opens
// an emoji grid. Picking closes it; tapping the current one again clears it.
const model = defineModel<string | null>({ required: true })
const reactions = useReactionsStore()
const open = ref(false)
const current = computed(() => (model.value ? reactions.byKey.get(model.value) : undefined))

onMounted(reactions.load)

function pick(key: string) {
  model.value = model.value === key ? null : key
  open.value = false
}

function clear() {
  model.value = null
  open.value = false
}
</script>

<template>
  <div class="reaction-picker">
    <div class="head">
      <span class="label">How was it?</span>
      <button
        type="button"
        class="trigger small"
        :class="{ empty: !current }"
        :aria-expanded="open"
        @click="open = !open"
      >
        <template v-if="current">
          <span class="emoji">{{ current.emoji }}</span> {{ current.label }}
        </template>
        <template v-else><AppIcon name="plus" :size="14" /> Add a reaction</template>
        <AppIcon :name="open ? 'chevron-up' : 'chevron-down'" />
      </button>
    </div>

    <div v-if="open" class="panel">
      <div class="grid" role="group" aria-label="Reaction">
        <button
          v-for="r in reactions.all"
          :key="r.key"
          type="button"
          class="tile"
          :class="{ selected: model === r.key }"
          :aria-pressed="model === r.key"
          :aria-label="r.label"
          :title="r.label"
          @click="pick(r.key)"
        >
          {{ r.emoji }}
        </button>
      </div>
      <div v-if="current" class="foot">
        <span>
          {{ current.emoji }} <strong>{{ current.label }}</strong>
        </span>
        <button type="button" class="plain small" @click="clear">
          <AppIcon name="close" :size="12" /> Clear
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reaction-picker {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.trigger {
  border-radius: 999px;
  background: var(--fg);
  color: var(--bg);
  box-shadow: 0 3px 0 var(--red);
}

.trigger.empty {
  background: var(--card);
  color: var(--fg);
  box-shadow: 0 3px 0 var(--edge);
}

.emoji {
  font-size: 1.25rem;
  line-height: 1;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem;
  border: 2px solid var(--line);
  border-radius: 0.75rem;
  background: var(--card);
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
}

.tile {
  height: 2.9rem;
  padding: 0;
  font-size: 1.5rem;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.tile.selected {
  background: var(--fg);
  border-color: var(--line);
  box-shadow: 0 3px 0 var(--red);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.6rem;
  border-top: 2px dashed var(--faint);
}
</style>
