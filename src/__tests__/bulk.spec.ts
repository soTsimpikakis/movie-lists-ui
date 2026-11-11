import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RewardEvent, SetRewardEvent } from '@/api/types'
import { BATCH, mergeEvents, saveSeen } from '@/lib/bulk'

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

  it('folds Journey news from every batch into one summary', () => {
    const merged = mergeEvents([
      [
        {
          kind: 'journey_summary',
          stamps: ['US', 'JP'],
          genre_levels: [{ subject: 'Drama', level: 1, level_name: 'Novice' }],
          decade_levels: [],
        },
      ],
      [
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
})
