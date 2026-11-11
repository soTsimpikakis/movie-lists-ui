import { describe, expect, it } from 'vitest'

import { USERNAME_PATTERN, suggestUsername, userTag } from '@/lib/username'

describe('suggestUsername', () => {
  it('uses the email name, keeping only allowed characters', () => {
    expect(suggestUsername('Ann.Smith+films@example.com')).toBe('ann.smithfilms')
  })

  it('pads names that are too short', () => {
    expect(suggestUsername('me@example.com')).toBe('userme')
  })

  it('always suggests something the pattern accepts', () => {
    const pattern = new RegExp(`^${USERNAME_PATTERN}$`)
    for (const email of ['a@b.c', 'Ünïcødé@x.y', 'x'.repeat(40) + '@z.z']) {
      expect(suggestUsername(email)).toMatch(pattern)
    }
  })
})

describe('userTag', () => {
  it('joins the username and id', () => {
    expect(userTag({ username: 'annie.films', id: 12 })).toBe('annie.films#12')
  })
})
