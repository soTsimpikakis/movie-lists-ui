import { describe, expect, it } from 'vitest'

import type { AdminEgg, EggInput } from '@/api/types'
import { daysIn, keyFrom, matchKind, matchText, previewEvent, whenText } from '@/lib/eggs'

const dates = (
  sm: number,
  sd: number,
  em: number,
  ed: number,
  only_year: number | null = null,
) => ({
  start_month: sm,
  start_day: sd,
  end_month: em,
  end_day: ed,
  only_year,
})

describe('eggs', () => {
  it('writes the dates the short way', () => {
    expect(whenText(dates(11, 5, 11, 5))).toBe('5 Nov')
    expect(whenText(dates(12, 24, 12, 26))).toBe('24–26 Dec')
    expect(whenText(dates(12, 30, 1, 2))).toBe('30 Dec – 2 Jan')
    expect(whenText(dates(10, 21, 10, 21, 2015))).toBe('21 Oct, 2015 only')
  })

  it('counts 29 February', () => {
    expect([daysIn(2), daysIn(4), daysIn(12)]).toEqual([29, 30, 31])
  })

  it('says what an egg matches', () => {
    const egg = (fields: Partial<AdminEgg>) =>
      ({ match: {}, films: [], min_count: 1, ...fields }) as AdminEgg
    expect(
      matchText(
        egg({ match: { film: 562 }, films: [{ tmdb_id: 562, title: 'Die Hard', year: 1988 }] }),
      ),
    ).toBe('Die Hard')
    expect(matchText(egg({ match: { films: [1, 2, 3] } }))).toBe('Any of 3 films')
    expect(matchText(egg({ match: { genre: 'Horror' }, min_count: 3 }))).toBe('3 × Horror film')
    expect(
      matchText(egg({ match: { keyword: 207317 } }), [
        { id: 207317, name: 'Christmas', keyword: true },
      ]),
    ).toBe('Any Christmas film')
    expect(matchKind({ keyword: 1 })).toBe('keyword')
  })

  it('suggests a key from the title', () => {
    expect(keyFrom('Remember, remember!')).toBe('remember-remember')
    expect(keyFrom('Café Society 2')).toBe('cafe-society-2')
  })
})

describe('previewEvent', () => {
  const input = (o: Partial<EggInput> = {}): EggInput => ({
    key: 'yippee-ki-yay',
    title: 'Yippee-ki-yay',
    lore: "  Settled: it's a Christmas movie.  ",
    hint: '  Nakatomi Plaza  ',
    notes: null,
    start_month: 12,
    start_day: 24,
    end_month: 12,
    end_day: 26,
    only_year: null,
    match: { film: 562 },
    min_count: 1,
    repeat: 'yearly',
    ...o,
  })

  it('shows the card a find would, with this year for a yearly egg', () => {
    expect(previewEvent(input(), 'Die Hard')).toEqual({
      kind: 'easter_egg',
      key: 'yippee-ki-yay',
      title: 'Yippee-ki-yay',
      lore: "Settled: it's a Christmas movie.",
      hint: 'Nakatomi Plaza',
      year: new Date().getFullYear(),
      film_title: 'Die Hard',
    })
  })

  it('uses an anniversary year, and none for a once-ever egg', () => {
    expect(previewEvent(input({ only_year: 2015 }), 'Die Hard').year).toBe(2015)
    expect(previewEvent(input({ repeat: 'once' }), 'Die Hard').year).toBeNull()
  })

  it('fills in a blank title and drops blank lore and hints', () => {
    const blank = previewEvent(input({ title: '', lore: '   ', hint: null }), 'Die Hard')
    expect([blank.title, blank.lore, blank.hint]).toEqual(['Untitled egg', null, null])
  })
})
