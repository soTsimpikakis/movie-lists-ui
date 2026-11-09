<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import { useReactionsStore } from '@/stores/reactions'

// Compact on purpose (design.md §6.4): one button with the current reaction, which opens
// an emoji grid. Tapping an emoji only previews it, so its name can be read; Confirm
// settles it, and closing the panel without confirming keeps the old reaction.
const model = defineModel<string | null>({ required: true })
const reactions = useReactionsStore()
const open = ref(false)
const preview = ref<string | null>(null)
const current = computed(() => (model.value ? reactions.byKey.get(model.value) : undefined))
const previewed = computed(() => (preview.value ? reactions.byKey.get(preview.value) : undefined))

onMounted(reactions.load)

function toggle() {
  open.value = !open.value
  preview.value = model.value
}

function confirm() {
  model.value = preview.value
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
        @click="toggle"
      >
        <template v-if="current">
          <span class="emoji">{{ current.emoji }}</span> {{ current.label }}
        </template>
        <template v-else><AppIcon name="plus" :size="14" /> Add a reaction</template>
        <AppIcon :name="open ? 'chevron-up' : 'chevron-down'" />
      </button>
    </div>

    <div v-if="open" class="panel">
      <div class="grid" role="radiogroup" aria-label="Reaction">
        <button
          v-for="r in reactions.all"
          :key="r.key"
          type="button"
          role="radio"
          class="tile emoji"
          :class="{ selected: preview === r.key }"
          :aria-checked="preview === r.key"
          :aria-label="r.label"
          @click="preview = r.key"
        >
          {{ r.emoji }}
        </button>
      </div>
      <div class="foot">
        <span v-if="previewed" class="preview" aria-live="polite">
          <span class="emoji">{{ previewed.emoji }}</span>
          <strong>{{ previewed.label }}</strong>
        </span>
        <span v-else class="muted">Tap one to see what it means</span>
        <span class="actions">
          <button v-if="current" type="button" class="plain small" @click="clear">
            <AppIcon name="close" :size="12" /> Clear
          </button>
          <button
            type="button"
            class="small"
            :disabled="!preview || preview === model"
            @click="confirm"
          >
            <AppIcon name="check" :size="12" /> Confirm
          </button>
        </span>
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

.trigger .emoji {
  font-size: 1.2rem;
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
  color: var(--fg);
  border-color: transparent;
  box-shadow: none;
}

.tile.selected {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--line);
  box-shadow: 0 3px 0 var(--red);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-height: 2.6rem;
  padding-top: 0.6rem;
  border-top: 2px dashed var(--faint);
}

.preview {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.preview .emoji {
  font-size: 1.4rem;
}

.foot .muted {
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex: none;
}
</style>
