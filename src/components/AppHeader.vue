<script setup lang="ts">
import { computed } from 'vue'

import { userTag } from '@/lib/username'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const initial = computed(() => (auth.user?.display_name.trim()[0] ?? '?').toUpperCase())
const tag = computed(() => (auth.user ? userTag(auth.user) : ''))
</script>

<template>
  <header class="app-header">
    <div class="topbar">
      <h1>Movie Club</h1>
      <!-- Profile: name, username, password, log out. -->
      <RouterLink
        :to="{ name: 'profile' }"
        class="button-link profile"
        :aria-label="`Profile: ${tag}`"
        :title="`Profile · ${tag}`"
      >
        {{ initial }}
      </RouterLink>
    </div>
    <span class="tagline">Now showing · your life in films</span>
  </header>
  <!-- Outside the header so it can stick to the top after the header scrolls away. -->
  <nav class="tabs">
    <RouterLink :to="{ name: 'home' }">Watched</RouterLink>
    <RouterLink :to="{ name: 'library' }">Library</RouterLink>
    <RouterLink :to="{ name: 'sets' }" :class="{ 'router-link-active': $route.name === 'set' }">
      Sets
    </RouterLink>
    <RouterLink :to="{ name: 'journey' }">Journey</RouterLink>
  </nav>
</template>

<style scoped>
/* A full-width red band; the padding lines its content up with the page column. */
.app-header,
.tabs {
  margin-inline: calc(50% - 50vw);
  padding-inline: calc(50vw - 50%);
  background: var(--red);
  color: var(--on-red);
}

.app-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: -1.5rem;
  padding-top: 1.25rem;
  padding-bottom: 0.75rem;
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

.profile {
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  border-color: var(--on-red);
  border-radius: 50%;
  background: transparent;
  color: var(--on-red);
  box-shadow: none;
  font-family: var(--display);
  font-weight: 400;
  font-size: 1.15rem;
}

.profile.router-link-active {
  background: var(--on-red);
  color: var(--red);
}

.tagline {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.85;
}

.tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  border-bottom: 4px solid var(--line);
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

/* Four tabs on a phone: a little tighter, and they can scroll sideways if a screen is tiny. */
@media (max-width: 480px) {
  .tabs {
    gap: 0.15rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs a {
    flex: none;
    padding: 0.6rem 0.6rem;
    font-size: 0.8rem;
  }
}
</style>
