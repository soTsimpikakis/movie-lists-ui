import { describe, expect, it } from 'vitest'

import type { JourneyRewardEvent, SetRewardEvent } from '@/api/types'
import { rewardCopy } from '@/lib/rewardCopy'

const event = (overrides: Partial<SetRewardEvent>): SetRewardEvent => ({
  kind: 'set_progressed',
  set_id: 1,
  title: 'The Matrix',
  theme_key: null,
  watched: 2,
  total: 4,
  new_films: ['The Matrix Reloaded'],
  ...overrides,
})

const level = (overrides: Partial<JourneyRewardEvent>): JourneyRewardEvent => ({
  kind: 'genre_level',
  subject: 'Science Fiction',
  level: 1,
  level_name: 'Novice',
  count: 5,
  next_at: 15,
  ...overrides,
})

describe('rewardCopy', () => {
  it('counts what is left on a progressed set', () => {
    expect(rewardCopy(event({})).body).toBe('One more hole punched: 2 of 4, 2 to go.')
    expect(rewardCopy(event({ new_films: ['A', 'B'] })).body).toMatch(/^2 more holes punched/)
  })

  it('awards gold on completion and on polish', () => {
    expect(rewardCopy(event({ kind: 'set_completed', watched: 4 })).headline).toBe('Gold trophy!')
    const polished = rewardCopy(
      event({ kind: 'set_polished', watched: 4, new_films: ['Resurrections'] }),
    )
    expect(polished.headline).toBe('Back to gold')
    expect(polished.body).toContain('Resurrections caught you up with The Matrix')
  })

  it('uses themed lines for themed sets', () => {
    const done = rewardCopy(
      event({ kind: 'set_completed', theme_key: 'star-wars', title: 'Star Wars' }),
    )
    expect(done.body).toContain('The Force is strong with this one.')
  })
})

describe('rewardCopy for the Journey', () => {
  it('names the level and what it takes to reach the next', () => {
    const copy = rewardCopy(level({}))
    expect(copy.headline).toBe('Science Fiction: Novice')
    expect(copy.body).toBe('5 films of Science Fiction. 10 more to Buff.')
    const top = level({ level: 5, level_name: 'Legend', count: 100, next_at: null })
    expect(rewardCopy(top).body).toContain('The top level')
  })

  it('writes decades and countries out', () => {
    expect(rewardCopy(level({ kind: 'decade_level', subject: '1990' })).headline).toBe(
      'The 1990s: Novice',
    )
    const stamp = rewardCopy(level({ kind: 'country_stamp', subject: 'KR', level_name: null }))
    expect(stamp.body).toContain('South Korea')
  })

  it('sums up a bulk add in one sentence', () => {
    const copy = rewardCopy({
      kind: 'journey_summary',
      stamps: ['US', 'JP'],
      genre_levels: [{ subject: 'Drama', level: 1, level_name: 'Novice' }],
      decade_levels: [],
    })
    expect(copy.body).toBe(
      'Your library earned 2 passport stamps and 1 genre level. Find them all on the Journey tab.',
    )
  })
})
