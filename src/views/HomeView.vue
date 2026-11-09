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
  <main class="page">
    <header class="topbar">
      <h1>Movie Club</h1>
      <button class="link" @click="logout">Log out</button>
    </header>
    <p>Hi {{ auth.user?.display_name }}. Nothing logged yet.</p>
  </main>
</template>
