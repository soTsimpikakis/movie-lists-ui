import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api, ApiError, post } from '@/api/client'

export interface Me {
  id: number
  email: string
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

  async function login(email: string, password: string) {
    user.value = await post<Me>('/auth/login', { email, password })
  }

  async function acceptInvite(token: string, displayName: string, password: string) {
    user.value = await post<Me>(`/invites/${encodeURIComponent(token)}/accept`, {
      display_name: displayName,
      password,
    })
  }

  async function logout() {
    await post('/auth/logout')
    user.value = null
  }

  return { user, loaded, fetchMe, login, acceptInvite, logout }
})
