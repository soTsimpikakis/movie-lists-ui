import { describe, expect, it } from 'vitest'

import type { Watch } from '@/api/types'
import { toDiary } from '@/lib/diary'

let id = 0
const watch = (watched_on: string | null): Watch =>
  ({ id: ++id, watched_on, film: { title: `Film ${id}` } }) as Watch

describe('toDiary', () => {
  it('groups by year then month, newest first, with full month counts', () => {
    const diary = toDiary(
      [watch('2026-11-20'), watch('2026-11-02'), watch('2026-10-31'), watch('2025-12-25')],
      [
        { month: '2026-11', count: 2 },
        { month: '2026-10', count: 3 },
        { month: '2025-12', count: 1 },
        { month: '2025-11', count: 4 },
      ],
    )
    expect(
      diary.map((y) => [y.year, y.count, y.months.map((m) => [m.name, m.count, m.items.length])]),
    ).toEqual([
      [
        '2026',
        5,
        [
          ['November', 2, 2],
          ['October', 3, 1],
        ],
      ],
      // A year's count includes months not loaded yet.
      ['2025', 5, [['December', 1, 1]]],
    ])
  })

  it('skips undated watches', () => {
    expect(toDiary([watch(null)], [])).toEqual([])
  })

  it('never shows a count below what is on screen', () => {
    const [year] = toDiary([watch('2026-01-05'), watch('2026-01-06')], [])
    expect([year!.count, year!.months[0]!.count]).toEqual([2, 2])
  })
})
