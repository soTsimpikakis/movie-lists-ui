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

  it('stores the user after login with a username or email', async () => {
    const me = { id: 1, email: 'ann@example.com', username: 'ann', display_name: 'Ann' }
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(respond(200, me))
    vi.stubGlobal('fetch', fetch)
    const auth = useAuthStore()
    await auth.login('ann', 'secret123')
    expect(auth.user).toEqual(me)
    expect(JSON.parse(String(fetch.mock.calls[0]![1]!.body))).toEqual({
      login: 'ann',
      password: 'secret123',
    })
  })

  it('surfaces the API error message on failed login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respond(401, { detail: 'Wrong email or password' })),
    )
    await expect(useAuthStore().login('a@b.c', 'nope')).rejects.toThrow('Wrong email or password')
  })
})
