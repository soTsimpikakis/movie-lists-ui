<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AdminEggsList from '@/components/AdminEggsList.vue'
import AdminMaintenance from '@/components/AdminMaintenance.vue'
import AdminMissionsList from '@/components/AdminMissionsList.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

// The admin view (design.md §6.6): laptop-first and plain. Tabs for Easter eggs, Missions and
// Maintenance; each tab loads only what it shows.
const route = useRoute()
const maintenance = computed(() => route.name === 'admin-maintenance')
const missionsTab = computed(() => route.name === 'admin-missions')
const eggsTab = computed(() => !maintenance.value && !missionsTab.value)
</script>

<template>
  <main class="page wide">
    <AppHeader />

    <div class="heading">
      <h2>Admin</h2>
      <nav class="tabs" aria-label="Admin sections">
        <RouterLink
          class="button-link small"
          :class="eggsTab ? 'mustard' : 'plain'"
          :to="{ name: 'admin' }"
          :aria-current="eggsTab ? 'page' : undefined"
        >
          <AppIcon name="egg" :size="14" /> Easter eggs
        </RouterLink>
        <RouterLink
          class="button-link small"
          :class="missionsTab ? 'mustard' : 'plain'"
          :to="{ name: 'admin-missions' }"
          :aria-current="missionsTab ? 'page' : undefined"
        >
          <AppIcon name="trophy" :size="14" /> Missions
        </RouterLink>
        <RouterLink
          class="button-link small"
          :class="maintenance ? 'mustard' : 'plain'"
          :to="{ name: 'admin-maintenance' }"
          :aria-current="maintenance ? 'page' : undefined"
        >
          <AppIcon name="sparkle" :size="14" /> Maintenance
        </RouterLink>
      </nav>
    </div>

    <AdminMaintenance v-if="maintenance" />
    <AdminMissionsList v-else-if="missionsTab" />
    <AdminEggsList v-else />
  </main>
</template>

<style scoped>
.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.heading h2 {
  margin: 0;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
</style>
