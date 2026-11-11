<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import { USERNAME_PATTERN, userTag } from '@/lib/username'
import { useAuthStore } from '@/stores/auth'

// Profile (design.md §12, Phase 6A): name, username, password, log out. The style picker
// from the idea bank will join it later.
const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const username = ref('')
const profileStatus = ref('')
const profileError = ref('')
const savingProfile = ref(false)

watch(
  () => auth.user,
  (user) => {
    name.value = user?.display_name ?? ''
    username.value = user?.username ?? ''
  },
  { immediate: true },
)

const profileChanged = computed(
  () => name.value.trim() !== auth.user?.display_name || username.value !== auth.user?.username,
)

async function saveProfile() {
  profileError.value = ''
  profileStatus.value = ''
  savingProfile.value = true
  try {
    await auth.updateProfile({ display_name: name.value.trim(), username: username.value })
    profileStatus.value = 'Saved'
  } catch (e) {
    profileError.value = e instanceof Error ? e.message : String(e)
  } finally {
    savingProfile.value = false
  }
}

const currentPassword = ref('')
const newPassword = ref('')
const repeatPassword = ref('')
const passwordStatus = ref('')
const passwordError = ref('')
const savingPassword = ref(false)

async function changePassword() {
  passwordError.value = ''
  passwordStatus.value = ''
  if (newPassword.value !== repeatPassword.value) {
    passwordError.value = "The new passwords don't match"
    return
  }
  savingPassword.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = newPassword.value = repeatPassword.value = ''
    passwordStatus.value = 'Password changed. Your other devices were logged out.'
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : String(e)
  } finally {
    savingPassword.value = false
  }
}

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <main class="page">
    <AppHeader />

    <h2 class="heading">Profile</h2>
    <p v-if="auth.user" class="tag">{{ userTag(auth.user) }}</p>

    <form class="card stack" @submit.prevent="saveProfile">
      <span class="label">You</span>
      <label>
        Name
        <input v-model="name" autocomplete="nickname" maxlength="80" required />
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
        />
        <span class="hint">Log in with this or your email ({{ auth.user?.email }}).</span>
      </label>
      <p v-if="profileError" class="error">{{ profileError }}</p>
      <p v-else-if="profileStatus" class="muted" role="status">{{ profileStatus }}</p>
      <button type="submit" :disabled="!profileChanged || savingProfile">
        <AppIcon name="check" :size="14" /> Save
      </button>
    </form>

    <form class="card stack" @submit.prevent="changePassword">
      <span class="label">Password</span>
      <label>
        Current password
        <input v-model="currentPassword" type="password" autocomplete="current-password" required />
      </label>
      <label>
        New password
        <input
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>
      <label>
        New password again
        <input
          v-model="repeatPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>
      <p v-if="passwordError" class="error">{{ passwordError }}</p>
      <p v-else-if="passwordStatus" class="muted" role="status">{{ passwordStatus }}</p>
      <button type="submit" :disabled="savingPassword">
        <AppIcon name="check" :size="14" /> Change password
      </button>
    </form>

    <button class="plain logout" @click="logout">
      <AppIcon name="logout" :size="14" /> Log out
    </button>
  </main>
</template>

<style scoped>
.page {
  max-width: 32rem;
}

.heading {
  margin: 0;
  font-size: 1.15rem;
}

/* username#id, stamped like a ticket's member number. */
.tag {
  margin: 0.2rem 0 1.1rem;
  font-family: var(--ticket-type);
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: var(--red);
}

.card {
  margin-bottom: 1.25rem;
  padding: 1.1rem 1.2rem 1.25rem;
  border: 2px solid var(--ticket-line);
  border-radius: 0.75rem;
  background: var(--parchment-paper);
  color: var(--parchment-ink);
  filter: var(--ticket-shadow);
}

.card .label {
  color: var(--red);
}

.card input {
  background: #fff8ec;
  color: var(--parchment-ink);
}

.hint {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--parchment-muted);
}

.card .muted {
  margin: 0;
  color: var(--parchment-muted);
}

.card button {
  align-self: flex-start;
}

.logout {
  margin-top: 0.25rem;
}
</style>
