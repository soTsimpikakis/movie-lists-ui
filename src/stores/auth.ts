import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api, ApiError, patch, post } from '@/api/client'

export interface Me {
  id: number
  email: string
  username: string
  display_name: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null)
  const loaded = ref(false)

  async function fetchMe() {
    try {
      user.value = await api<Me>('/auth/me')
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
      user.value = null
    } finally {
      loaded.value = true
    }
  }

  /** `login` is an email or a username. */
  async function login(login: string, password: string) {
    user.value = await post<Me>('/auth/login', { login, password })
  }

  async function acceptInvite(
    token: string,
    displayName: string,
    username: string,
    password: string,
  ) {
    user.value = await post<Me>(`/invites/${encodeURIComponent(token)}/accept`, {
      display_name: displayName,
      username,
      password,
    })
  }

  async function updateProfile(changes: { display_name?: string; username?: string }) {
    user.value = await patch<Me>('/auth/me', changes)
  }

  /** Logs this account out on every other device. */
  async function changePassword(currentPassword: string, newPassword: string) {
    await post('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  async function logout() {
    await post('/auth/logout')
    user.value = null
  }

  return { user, loaded, fetchMe, login, acceptInvite, updateProfile, changePassword, logout }
})
