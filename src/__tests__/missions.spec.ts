import { describe, expect, it } from 'vitest'

import { goalText, seasonText } from '@/lib/missions'
import { rewardCopy } from '@/lib/rewardCopy'

describe('missions', () => {
  it('writes the season the short way', () => {
    expect(seasonText('2026-12-18', '2026-12-31')).toBe('18–31 Dec')
    expect(seasonText('2026-12-30', '2027-01-02')).toBe('30 Dec – 2 Jan')
    expect(seasonText(null, null)).toBe('Open-ended')
  })

  it('says what the goal is', () => {
    const goal = { goal_subject: 'Christmas', needed: 3, listed: 0 }
    expect(goalText({ ...goal, goal_kind: 'count_matching' })).toBe('3 Christmas films')
    expect(goalText({ ...goal, goal_kind: 'all_of_list', needed: 4 })).toBe('All 4 films')
    expect(goalText({ ...goal, goal_kind: 'count_of_list', needed: 5, listed: 12 })).toBe(
      '5 of these 12 films',
    )
  })

  it('celebrates a finished mission with its own line, or a plain one', () => {
    const event = {
      kind: 'mission' as const,
      key: 'christmas-week',
      title: 'Christmas Week',
      finish_copy: 'The halls are decked.',
      year: 2026,
      count: 3,
    }
    expect(rewardCopy(event)).toEqual({
      label: 'Mission complete',
      headline: 'Christmas Week',
      body: 'The halls are decked.',
    })
    expect(rewardCopy({ ...event, finish_copy: null }).body).toBe('Done: 3 films. Nicely watched.')
  })
})
