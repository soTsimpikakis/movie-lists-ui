<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const login = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.login(login.value, password.value)
    const next = typeof route.query.next === 'string' ? route.query.next : '/'
    // Only follow in-app paths, never "//other-site".
    await router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page narrow">
    <span class="admit">Members only · admit one</span>
    <h1>Movie Club</h1>
    <form class="stack" @submit.prevent="submit">
      <label>
        Email or username
        <input
          v-model="login"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          maxlength="320"
          required
        />
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="busy">Log in</button>
    </form>
    <p class="muted invite-note">
      New here? Movie Club is invite-only. Ask a member for an invite link and open it to create
      your account.
    </p>
  </main>
</template>

<style scoped>
.admit {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--red);
}

h1 {
  margin: 0.4rem 0 1.25rem;
  font-size: 2.2rem;
  color: var(--red);
}

.invite-note {
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
