import { describe, expect, it } from 'vitest'

import type { SetRewardEvent } from '@/api/types'
import { toCards } from '@/lib/rewardCards'

function progressed(set_id: number, watched: number, total: number): SetRewardEvent {
  return {
    kind: 'set_progressed',
    set_id,
    title: `Set ${set_id}`,
    theme_key: null,
    watched,
    total,
    new_films: ['Parasite'],
  }
}

describe('toCards', () => {
  it('leaves two progress cards alone', () => {
    const events = [progressed(1, 1, 9), progressed(2, 1, 98)]
    expect(toCards(events)).toEqual(events)
  })

  it('keeps the set closest to done and folds the rest into one card', () => {
    const completed = { ...progressed(9, 3, 3), kind: 'set_completed' as const }
    const cards = toCards([
      completed,
      progressed(1, 1, 98),
      progressed(2, 8, 9),
      progressed(3, 1, 9),
    ])
    expect(cards.map((c) => c.kind)).toEqual(['set_completed', 'set_progressed', 'sets_summary'])
    expect(cards[1]).toMatchObject({ set_id: 2 })
    expect(cards[2]).toEqual({
      kind: 'sets_summary',
      sets: [
        { set_id: 3, title: 'Set 3', watched: 1, total: 9 },
        { set_id: 1, title: 'Set 1', watched: 1, total: 98 },
      ],
    })
  })
})
