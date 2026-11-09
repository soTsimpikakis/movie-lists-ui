<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="app-header">
    <div class="topbar">
      <h1>Movie Club</h1>
      <button class="link" @click="logout">Log out</button>
    </div>
    <nav class="tabs">
      <RouterLink :to="{ name: 'home' }">Watched</RouterLink>
      <RouterLink :to="{ name: 'sets' }" :class="{ 'router-link-active': $route.name === 'set' }">
        Sets
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  margin-bottom: 1rem;
}

.app-header h1 {
  margin: 0;
}

.tabs {
  display: flex;
  gap: 1.25rem;
  margin-top: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.tabs a {
  padding: 0.4rem 0;
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tabs a.router-link-exact-active,
.tabs a.router-link-active {
  color: var(--fg);
  border-bottom-color: var(--accent);
}
</style>
