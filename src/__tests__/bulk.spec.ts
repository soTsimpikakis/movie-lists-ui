import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  EggEvent,
  FeatEvent,
  LogMilestoneEvent,
  MissionEvent,
  RewardEvent,
  SetRewardEvent,
} from '@/api/types'
import { BATCH, mergeEvents, PartialSaveError, saveSeen } from '@/lib/bulk'

const set = (overrides: Partial<SetRewardEvent>): SetRewardEvent => ({
  kind: 'set_progressed',
  set_id: 1,
  title: 'The Matrix',
  theme_key: null,
  watched: 1,
  total: 4,
  new_films: ['The Matrix'],
  ...overrides,
})

describe('mergeEvents', () => {
  it('passes a single batch through untouched', () => {
    const only: RewardEvent[] = [set({})]
    expect(mergeEvents([only])).toBe(only)
  })

  it('keeps one card per set with its best news and every new film', () => {
    const merged = mergeEvents([
      [set({ watched: 2, new_films: ['A', 'B'] })],
      [set({ kind: 'set_completed', watched: 4, new_films: ['C', 'D'] })],
      [set({ set_id: 2, title: 'Alien', watched: 1, total: 4, new_films: ['Alien'] })],
    ])
    expect(merged).toEqual([
      set({ kind: 'set_completed', watched: 4, new_films: ['A', 'B', 'C', 'D'] }),
      set({ set_id: 2, title: 'Alien', watched: 1, total: 4, new_films: ['Alien'] }),
    ])
  })

  it('keeps the highest library size from a back-fill in batches', () => {
    const at = (milestone: number, count: number): RewardEvent => ({
      kind: 'film_milestone',
      milestone,
      count,
      next_at: null,
    })
    expect(mergeEvents([[at(400, 450)], [at(500, 520)], []])).toEqual([at(500, 520)])
  })

  it('keeps the highest watch time checkpoint from a big back-fill', () => {
    const at = (hours: number, total: number): RewardEvent => ({
      kind: 'watch_time',
      hours,
      total_hours: total,
      next_at: null,
    })
    expect(mergeEvents([[at(500, 610)], [], [at(1000, 1334)]])).toEqual([at(1000, 1334)])
  })

  it('keeps only the highest tickets-logged milestone', () => {
    const at = (milestone: number): RewardEvent => ({
      kind: 'log_milestone',
      milestone,
      count: milestone,
      next_at: null,
    })
    expect(mergeEvents([[at(5)], [at(10)], []])).toEqual([at(10)])
  })

  it('folds Journey news from every batch into one summary', () => {
    const merged = mergeEvents([
      [
        {
          kind: 'journey_summary',
          stamps: ['US', 'JP'],
          genre_levels: [{ subject: 'Drama', level: 1, level_name: 'Novice' }],
          decade_levels: [],
          keyword_levels: [],
        },
      ],
      [
        {
          kind: 'keyword_level',
          subject: 'Heist',
          level: 1,
          level_name: 'Novice',
          count: 3,
          next_at: 10,
        },
        {
          kind: 'genre_level',
          subject: 'Drama',
          level: 2,
          level_name: 'Buff',
          count: 15,
          next_at: 30,
        },
        {
          kind: 'country_stamp',
          subject: 'KR',
          level: 1,
          level_name: null,
          count: 1,
          next_at: null,
        },
      ],
    ])
    expect(merged).toEqual([
      {
        kind: 'journey_summary',
        stamps: ['US', 'JP', 'KR'],
        genre_levels: [{ subject: 'Drama', level: 2, level_name: 'Buff' }],
        decade_levels: [],
        keyword_levels: [{ subject: 'Heist', level: 1, level_name: 'Novice' }],
      },
    ])
  })
})

describe('saveSeen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends batches and reports progress after each', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_url, init) => {
      const ids = JSON.parse(String(init!.body)).tmdb_ids as number[]
      return new Response(JSON.stringify({ added: ids.length, events: [] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetch)
    const progress: number[] = []
    const ids = Array.from({ length: BATCH * 2 + 50 }, (_, i) => i)

    const result = await saveSeen(ids, (done) => progress.push(done))

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(progress).toEqual([0, BATCH, BATCH * 2, ids.length])
    expect(result).toEqual({ added: ids.length, events: [] })
  })

  it('keeps what earlier batches earned when a later one fails', async () => {
    const stamp = {
      kind: 'country_stamp',
      subject: 'KR',
      level: 1,
      level_name: null,
      count: 1,
      next_at: null,
    }
    let calls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
        calls += 1
        if (calls === 2)
          return new Response(JSON.stringify({ detail: 'Proxy timeout' }), { status: 504 })
        return new Response(JSON.stringify({ added: BATCH, events: [stamp] }), { status: 200 })
      }),
    )
    const ids = Array.from({ length: BATCH * 3 }, (_, i) => i)

    const error = await saveSeen(ids).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(PartialSaveError)
    expect((error as PartialSaveError).message).toBe('Proxy timeout')
    expect((error as PartialSaveError).saved).toEqual({ added: BATCH, events: [stamp] })
  })
})

const egg = (o: Partial<EggEvent> = {}): EggEvent => ({
  kind: 'easter_egg',
  key: 'yippee-ki-yay',
  title: 'Yippee-ki-yay',
  lore: null,
  hint: null,
  year: 2025,
  film_title: 'Die Hard',
  ...o,
})

const mission = (o: Partial<MissionEvent> = {}): MissionEvent => ({
  kind: 'mission',
  key: 'christmas-week',
  title: 'Christmas Week',
  finish_copy: null,
  year: 2026,
  count: 3,
  ...o,
})

const feat = (o: Partial<FeatEvent> = {}): FeatEvent => ({
  kind: 'feat',
  feat: 'day',
  level: 3,
  name: 'Trilogy Mode',
  line: 'Beginning, middle, end.',
  best: true,
  times: 1,
  on: '2026-11-27',
  ...o,
})

const milestone: LogMilestoneEvent = {
  kind: 'log_milestone',
  milestone: 10,
  count: 10,
  next_at: 50,
}

describe('mergeEvents across batches', () => {
  it('has nothing to show for no batches', () => {
    expect(mergeEvents([])).toEqual([])
    expect(mergeEvents([[], []])).toEqual([])
  })

  it('keeps each egg, mission and feat once', () => {
    const merged = mergeEvents([
      [egg(), mission(), feat()],
      [egg(), mission(), feat()],
    ])
    expect(merged).toEqual([egg(), mission(), feat()])
  })

  it('tells apart the same key in another year, and feats on another day or rank', () => {
    const events = [
      egg(),
      egg({ year: 2024 }),
      mission(),
      mission({ year: null }),
      // An egg and a mission may share a key: they're different things.
      egg({ key: 'christmas-week', year: 2026 }),
      feat(),
      feat({ level: 2 }),
      feat({ on: '2026-11-28' }),
      feat({ feat: 'week', level: 3 }),
    ]
    expect(mergeEvents([events, [...events]])).toEqual(events)
  })

  it('puts eggs, missions and feats first, then trophies, milestones, the Journey and progress', () => {
    const merged = mergeEvents([
      [
        set({ set_id: 2, title: 'Alien' }),
        {
          kind: 'country_stamp',
          subject: 'KR',
          level: 1,
          level_name: null,
          count: 1,
          next_at: null,
        },
        milestone,
      ],
      [set({ kind: 'set_completed', watched: 4 }), feat(), mission(), egg()],
    ])
    expect(merged.map((e: RewardEvent) => e.kind)).toEqual([
      'feat',
      'mission',
      'easter_egg',
      'set_completed',
      'log_milestone',
      'journey_summary',
      'set_progressed',
    ])
  })
})
