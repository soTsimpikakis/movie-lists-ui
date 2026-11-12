import { describe, expect, it } from 'vitest'

import { formatDate, ordinal, posterUrl, ratingNote, todayIso } from '@/lib/format'

describe('format', () => {
  it('shows dates as DD-MM-YYYY', () => {
    expect(formatDate('2026-11-09')).toBe('09-11-2026')
  })

  it("uses the user's local date for today", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [102, '102nd'],
  ])('ordinal(%i) = %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected)
  })

  it('builds TMDB poster URLs', () => {
    expect(posterUrl('/abc.jpg', 'w92')).toBe('https://image.tmdb.org/t/p/w92/abc.jpg')
    expect(posterUrl(null)).toBeNull()
  })

  it('shows a rating with a short vote count', () => {
    expect(ratingNote(8.36, 37210)).toBe('★ 8.4 · 37k')
    expect(ratingNote(7, 1000)).toBe('★ 7.0 · 1k')
    expect(ratingNote(6.5, 1250)).toBe('★ 6.5 · 1.3k')
    expect(ratingNote(9, 12)).toBe('★ 9.0 · 12')
    expect(ratingNote(0, 0)).toBeUndefined()
  })
})
