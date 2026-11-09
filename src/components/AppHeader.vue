<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppIcon from '@/components/AppIcon.vue'
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
      <button class="logout small" @click="logout">
        <AppIcon name="logout" :size="14" /> Log out
      </button>
    </div>
    <span class="tagline">Now showing · your life in films</span>
    <nav class="tabs">
      <RouterLink :to="{ name: 'home' }">Watched</RouterLink>
      <RouterLink :to="{ name: 'sets' }" :class="{ 'router-link-active': $route.name === 'set' }">
        Sets
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
/* A full-width red band; the padding lines its content up with the page column. */
.app-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: -1.5rem calc(50% - 50vw) 1.25rem;
  padding: 1.25rem calc(50vw - 50%) 0;
  background: var(--red);
  color: var(--on-red);
  border-bottom: 4px solid var(--line);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  margin: 0;
  font-size: 1.85rem;
  letter-spacing: 0.02em;
}

.logout {
  background: transparent;
  color: var(--on-red);
  border-color: var(--on-red);
  box-shadow: none;
}

.tagline {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.85;
}

.tabs {
  display: flex;
  gap: 0.4rem;
}

.tabs a {
  padding: 0.6rem 1rem;
  font-family: var(--display);
  font-size: 0.9rem;
  color: var(--on-red);
  text-decoration: none;
  border-radius: 0.5rem 0.5rem 0 0;
}

.tabs a.router-link-exact-active,
.tabs a.router-link-active {
  background: var(--bg);
  color: var(--fg);
}
</style>
