<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const token = String(route.params.token)

const email = ref<string | null>(null)
const invalid = ref(false)
const displayName = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

onMounted(async () => {
  try {
    email.value = (await api<{ email: string }>(`/invites/${encodeURIComponent(token)}`)).email
  } catch {
    invalid.value = true
  }
})

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.acceptInvite(token, displayName.value, password.value)
    await router.replace({ name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page narrow">
    <h1>Welcome to Movie Club</h1>
    <p v-if="invalid">
      This invite link is invalid or has expired. Ask whoever sent it for a new one, or
      <RouterLink :to="{ name: 'login' }">log in</RouterLink>.
    </p>
    <form v-else-if="email" class="stack" @submit.prevent="submit">
      <p class="muted">Setting up an account for {{ email }}</p>
      <label>
        Your name
        <input v-model="displayName" autocomplete="nickname" maxlength="80" required />
      </label>
      <label>
        Password
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="busy">Create account</button>
    </form>
  </main>
</template>
