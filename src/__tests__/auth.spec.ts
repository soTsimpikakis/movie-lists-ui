import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '@/stores/auth'

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status })
}

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('treats 401 from /auth/me as logged out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, { detail: 'Not logged in' })))
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(auth.loaded).toBe(true)
    expect(auth.user).toBeNull()
  })

  it('stores the user after login', async () => {
    const me = { id: 1, email: 'ann@example.com', display_name: 'Ann' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(200, me)))
    const auth = useAuthStore()
    await auth.login('ann@example.com', 'secret123')
    expect(auth.user).toEqual(me)
  })

  it('surfaces the API error message on failed login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respond(401, { detail: 'Wrong email or password' })),
    )
    await expect(useAuthStore().login('a@b.c', 'nope')).rejects.toThrow('Wrong email or password')
  })
})
