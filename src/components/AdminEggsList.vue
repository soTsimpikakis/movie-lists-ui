<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, errorText } from '@/api/client'
import type { AdminEgg, Genre } from '@/api/types'
import AdminStatusList from '@/components/AdminStatusList.vue'
import { formatDate } from '@/lib/format'
import { matchText, whenText } from '@/lib/eggs'

// Easter eggs in the admin view (design.md §6.6), the next to come round first.
const eggs = ref<AdminEgg[] | null>(null)
const genres = ref<Genre[]>([])
const error = ref('')

onMounted(async () => {
  try {
    ;[eggs.value, genres.value] = await Promise.all([
      api<AdminEgg[]>('/admin/eggs'),
      api<Genre[]>('/genres'),
    ])
  } catch (e) {
    error.value = errorText(e)
  }
})
</script>

<template>
  <AdminStatusList
    :items="eggs"
    :error="error"
    new-label="New egg"
    :new-to="{ name: 'admin-egg-new' }"
    :to="(e) => ({ name: 'admin-egg', params: { id: e.id } })"
    :empty="(f) => (f === 'draft' ? 'No drafts. Every idea is out there.' : 'No eggs here yet.')"
  >
    <template #main="{ item: e }">
      <span class="title">{{ e.title }}</span>
      <span class="what">{{ whenText(e) }} · {{ matchText(e, genres) }}</span>
      <span v-if="e.lore" class="lore">{{ e.lore }}</span>
      <span v-else class="lore missing">No lore line yet</span>
    </template>
    <template #side="{ item: e }">
      <span class="muted small-text">found {{ e.found }}×</span>
      <span v-if="e.next_on" class="muted small-text"> next {{ formatDate(e.next_on) }} </span>
    </template>
  </AdminStatusList>
</template>

<style scoped>
.lore {
  font-style: italic;
}

.lore.missing {
  font-style: normal;
  color: var(--muted);
}
</style>
