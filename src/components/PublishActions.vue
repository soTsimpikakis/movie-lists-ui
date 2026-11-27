<script setup lang="ts">
import { ref } from 'vue'

import type { PublishStatus } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

// Enable / Switch off / Delete for an egg or a mission in the admin view. Delete asks again
// in the page, and is only offered while `deletable` (nobody has found or finished it).
defineProps<{
  status: PublishStatus
  deletable: boolean
  busy: boolean
  icon: 'egg' | 'trophy'
}>()
const emit = defineEmits<{ enable: []; disable: []; remove: [] }>()
const confirming = ref(false)
</script>

<template>
  <button
    v-if="status !== 'live'"
    type="button"
    class="mustard"
    :disabled="busy"
    @click="emit('enable')"
  >
    <AppIcon :name="icon" :size="14" /> Enable
  </button>
  <button v-else type="button" class="plain" :disabled="busy" @click="emit('disable')">
    <AppIcon name="eye-off" :size="14" /> Switch off
  </button>
  <template v-if="deletable">
    <button
      v-if="!confirming"
      type="button"
      class="danger"
      :disabled="busy"
      @click="confirming = true"
    >
      <AppIcon name="trash" :size="14" /> Delete
    </button>
    <span v-else class="confirm">
      Delete for good?
      <button type="button" class="danger small" :disabled="busy" @click="emit('remove')">
        Delete
      </button>
      <button type="button" class="plain small" @click="confirming = false">Keep it</button>
    </span>
  </template>
</template>

<style scoped>
.confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: var(--error);
}
</style>
