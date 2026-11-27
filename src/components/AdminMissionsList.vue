<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, errorText } from '@/api/client'
import type { AdminMission, Genre } from '@/api/types'
import AdminStatusList from '@/components/AdminStatusList.vue'
import { adminGoalText, seasonText } from '@/lib/missions'

// Missions in the admin view (design.md §6.6): the same pattern as eggs, the next season to
// end first.
const missions = ref<AdminMission[] | null>(null)
const genres = ref<Genre[]>([])
const error = ref('')

onMounted(async () => {
  try {
    ;[missions.value, genres.value] = await Promise.all([
      api<AdminMission[]>('/admin/missions'),
      api<Genre[]>('/genres'),
    ])
  } catch (e) {
    error.value = errorText(e)
  }
})
</script>

<template>
  <AdminStatusList
    :items="missions"
    :error="error"
    new-label="New mission"
    :new-to="{ name: 'admin-mission-new' }"
    :to="(m) => ({ name: 'admin-mission', params: { id: m.id } })"
    :empty="() => 'No missions here yet.'"
  >
    <template #main="{ item: m }">
      <span class="title">{{ m.title }}</span>
      <span class="what">
        {{ seasonText(m.season_start ?? m.starts_on, m.season_end ?? m.ends_on) }}
        <template v-if="m.repeats_yearly"> · every year</template> ·
        {{ adminGoalText(m, genres) }}
      </span>
      <span class="description">{{ m.description }}</span>
    </template>
    <template #side="{ item: m }">
      <span class="muted small-text">{{ m.joined }} in · done {{ m.finished }}×</span>
    </template>
  </AdminStatusList>
</template>
