import { describe, expect, it } from 'vitest'

import type { JourneyRewardEvent, LogMilestoneEvent, SetRewardEvent } from '@/api/types'
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
      keyword_levels: [{ subject: 'Heist', level: 1, level_name: 'Novice' }],
    })
    expect(copy.body).toBe(
      'Your library earned 2 passport stamps, 1 genre level and 1 niche level. ' +
        'Find them all on the Journey tab.',
    )
  })

  it('names a niche, with a flourish for some', () => {
    const heist = rewardCopy(
      level({ kind: 'keyword_level', subject: 'Heist', count: 3, next_at: 10 }),
    )
    expect([heist.label, heist.headline]).toEqual(['Niches', 'Heist: Novice'])
    expect(heist.body).toBe('3 films of Heist. Nobody move. 7 more to Buff.')
    const anime = rewardCopy(
      level({ kind: 'keyword_level', subject: 'Anime', count: 3, next_at: 10 }),
    )
    expect(anime.body).toBe('3 films of Anime. 7 more to Buff.')
  })

  describe('tickets logged', () => {
    const milestone = (o: Partial<LogMilestoneEvent>): LogMilestoneEvent => ({
      kind: 'log_milestone',
      milestone: 20,
      count: 20,
      next_at: 30,
      ...o,
    })

    it('welcomes the first ticket', () => {
      const copy = rewardCopy(milestone({ milestone: 1, count: 1, next_at: 5 }))
      expect(copy.headline).toBe('Your first ticket!')
      expect(copy.body).toBe('Welcome to the club. Your diary has begun. Next stop: 5.')
    })

    it('counts tickets towards the next milestone', () => {
      const copy = rewardCopy(milestone({}))
      expect(copy.headline).toBe('20 tickets')
      expect(copy.body).toBe('20 tickets logged since you joined. Next stop: 30.')
      expect(rewardCopy(milestone({ milestone: 10 })).headline).toBe('Double figures')
    })

    it('ends at the last milestone', () => {
      const copy = rewardCopy(milestone({ milestone: 1000, count: 1000, next_at: null }))
      expect(copy.body).toMatch(/last milestone/)
    })
  })
})
