<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api/client'
import { USERNAME_PATTERN, suggestUsername } from '@/lib/username'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const token = String(route.params.token)

const email = ref<string | null>(null)
const invalid = ref(false)
const displayName = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

onMounted(async () => {
  try {
    email.value = (await api<{ email: string }>(`/invites/${encodeURIComponent(token)}`)).email
    username.value = suggestUsername(email.value)
  } catch {
    invalid.value = true
  }
})

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.acceptInvite(token, displayName.value, username.value, password.value)
    // Straight into "Movies I've seen", so the first real screen already has progress (§5.3).
    await router.replace({ name: 'seen', query: { welcome: '1' } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page narrow">
    <span class="admit">Admit one · new member</span>
    <h1>Welcome to Movie Club</h1>
    <div v-if="invalid" class="stack">
      <p>
        This invite link is invalid or has expired. Ask whoever sent it for a new one, or log in if
        you already have an account.
      </p>
      <RouterLink :to="{ name: 'login' }" class="button-link">Log in</RouterLink>
    </div>
    <form v-else-if="email" class="stack" @submit.prevent="submit">
      <p class="muted">Setting up an account for {{ email }}</p>
      <label>
        Your name
        <input v-model="displayName" autocomplete="nickname" maxlength="80" required />
      </label>
      <label>
        Username
        <input
          v-model="username"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          :pattern="USERNAME_PATTERN"
          maxlength="30"
          required
          aria-describedby="username-hint"
        />
        <span id="username-hint" class="hint">
          You can log in with this or your email. Letters, numbers, dots and underscores.
        </span>
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
  font-size: 1.8rem;
}

.hint {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--muted);
}
</style>
