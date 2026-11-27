import { describe, expect, it } from 'vitest'

import type {
  EggEvent,
  FilmMilestoneEvent,
  JourneyRewardEvent,
  JourneySummaryEvent,
  LogMilestoneEvent,
  SetRewardEvent,
  WatchTimeEvent,
} from '@/api/types'
import { featStamp, rewardCopy } from '@/lib/rewardCopy'

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

  describe('watch time', () => {
    const at = (o: Partial<WatchTimeEvent>): WatchTimeEvent => ({
      kind: 'watch_time',
      hours: 24,
      total_hours: 24,
      next_at: 50,
      ...o,
    })

    it('names the day, week and month checkpoints', () => {
      expect(rewardCopy(at({})).headline).toBe('A full day of film')
      expect(rewardCopy(at({})).body).toBe('24 hours of film so far: 1 day. Next stop: 50 hours.')
      expect(rewardCopy(at({ hours: 720, total_hours: 730 })).headline).toBe('A month of film')
    })

    it('counts big totals in hours and days', () => {
      const copy = rewardCopy(at({ hours: 1000, total_hours: 1334, next_at: 1500 }))
      expect(copy.headline).toBe('1,000 hours')
      expect(copy.body).toBe(
        '1,334 hours of film so far: 55 days and 14 hours. Next stop: 1,500 hours.',
      )
    })

    it('ends at a year of film', () => {
      const copy = rewardCopy(at({ hours: 8760, total_hours: 8761, next_at: null }))
      expect([copy.headline, copy.body]).toEqual([
        'A year of film',
        '8,761 hours of film so far: 365 days and 1 hour. That was the last checkpoint. Legendary.',
      ])
    })
  })

  describe('library size', () => {
    const at = (o: Partial<FilmMilestoneEvent>): FilmMilestoneEvent => ({
      kind: 'film_milestone',
      milestone: 100,
      count: 100,
      next_at: 150,
      ...o,
    })

    it('names round sizes and counts the rest', () => {
      const copy = rewardCopy(at({}))
      expect([copy.label, copy.headline]).toEqual(['Library', 'A hundred films'])
      expect(copy.body).toBe('100 films in your library, each one counted once. Next stop: 150.')
      expect(rewardCopy(at({ milestone: 250, count: 262 })).headline).toBe('250 films')
    })

    it('ends at a thousand', () => {
      const copy = rewardCopy(at({ milestone: 1000, count: 1003, next_at: null }))
      expect([copy.headline, copy.body]).toEqual([
        'The thousand-film library',
        '1003 films in your library, each one counted once. That was the last milestone. Legendary.',
      ])
    })
  })
})

describe('rewardCopy for easter eggs', () => {
  const egg = (overrides: Partial<EggEvent>): EggEvent => ({
    kind: 'easter_egg',
    key: 'yippee-ki-yay',
    title: 'Yippee-ki-yay',
    lore: "Settled: it's a Christmas movie.",
    hint: null,
    year: 2025,
    film_title: 'Die Hard',
    ...overrides,
  })

  it('shows the title and the lore line', () => {
    expect(rewardCopy(egg({}))).toEqual({
      label: 'Easter egg',
      headline: 'Yippee-ki-yay',
      body: "Settled: it's a Christmas movie.",
    })
  })

  it('names the film when the egg has no lore yet', () => {
    expect(rewardCopy(egg({ lore: null })).body).toBe('You found it with Die Hard.')
  })
})

describe('rewardCopy for feats', () => {
  const feat = {
    kind: 'feat' as const,
    feat: 'day' as const,
    level: 3,
    name: 'Trilogy Mode',
    line: 'Beginning, middle, end. All of them today.',
    best: true,
    times: 1,
    on: '2026-11-27',
  }

  it('celebrates a new best with its line', () => {
    expect(rewardCopy(feat)).toEqual({
      label: 'Feat',
      headline: 'Trilogy Mode',
      body: 'Beginning, middle, end. All of them today.',
    })
  })

  it('counts a rank reached again', () => {
    expect(rewardCopy({ ...feat, best: false, times: 4 })).toEqual({
      label: 'Feat again',
      headline: 'Trilogy Mode again',
      body: "That's ×4. Beginning, middle, end. All of them today.",
    })
  })

  it('stamps the burst', () => {
    expect(featStamp({ feat: 'day', level: 3 })).toBe('3 in a day')
    expect(featStamp({ feat: 'day', level: 7 })).toBe('7+ in a day')
    expect(featStamp({ feat: 'week', level: 21 })).toBe('21+ in a week')
  })
})

describe('rewardCopy for summaries', () => {
  const summary = (o: Partial<JourneySummaryEvent>): JourneySummaryEvent => ({
    kind: 'journey_summary',
    stamps: [],
    genre_levels: [],
    decade_levels: [],
    keyword_levels: [],
    ...o,
  })

  it('names a single kind of Journey news on its own', () => {
    expect(rewardCopy(summary({ stamps: ['US'] })).body).toBe(
      'Your library earned 1 passport stamp. Find them all on the Journey tab.',
    )
    const eras = summary({
      decade_levels: [
        { subject: '1980', level: 1, level_name: 'Novice' },
        { subject: '1990', level: 2, level_name: 'Buff' },
      ],
    })
    expect(rewardCopy(eras).body).toBe(
      'Your library earned 2 era levels. Find them all on the Journey tab.',
    )
  })

  it('reads well with nothing in it', () => {
    const copy = rewardCopy(summary({}))
    expect(copy.body).toBe('Find your progress on the Journey tab.')
    expect(copy.body).not.toMatch(/undefined/)
  })

  it('counts the sets folded into one card', () => {
    const sets = [1, 2, 3].map((id) => ({ set_id: id, title: `Set ${id}`, watched: 1, total: 5 }))
    expect(rewardCopy({ kind: 'sets_summary', sets })).toEqual({
      label: 'Set progress',
      headline: '3 more sets moved',
      body: 'Find them all on the Sets tab.',
    })
  })
})
