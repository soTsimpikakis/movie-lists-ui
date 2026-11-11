import { post } from '@/api/client'
import type {
  JourneySummaryEvent,
  LevelUp,
  RewardEvent,
  SeenResult,
  SetRewardEvent,
} from '@/api/types'

// Big "Movies I've seen" saves go in batches, so the loading screen can show real progress
// and no single request comes near the proxy's time limit (design.md §5.3).
export const BATCH = 50

/** Save films as seen, `BATCH` at a time; `onProgress(done, total)` after each batch. */
export async function saveSeen(
  tmdbIds: number[],
  onProgress: (done: number, total: number) => void = () => {},
): Promise<SeenResult> {
  const batches: SeenResult[] = []
  onProgress(0, tmdbIds.length)
  for (let start = 0; start < tmdbIds.length; start += BATCH) {
    const ids = tmdbIds.slice(start, start + BATCH)
    batches.push(await post<SeenResult>('/watches/seen', { tmdb_ids: ids }))
    onProgress(Math.min(start + BATCH, tmdbIds.length), tmdbIds.length)
  }
  return {
    added: batches.reduce((sum, b) => sum + b.added, 0),
    events: mergeEvents(batches.map((b) => b.events)),
  }
}

const SET_RANK = { set_progressed: 0, set_polished: 1, set_completed: 2 } as const

/**
 * One set of reward cards for several batches: one card per set (its best news, latest
 * count, all its new films) and one Journey summary with every stamp and highest level.
 */
export function mergeEvents(batches: RewardEvent[][]): RewardEvent[] {
  if (batches.length === 1) return batches[0]!
  const sets = new Map<number, SetRewardEvent>()
  const stamps = new Set<string>()
  const genres = new Map<string, LevelUp>()
  const decades = new Map<string, LevelUp>()
  const raise = (into: Map<string, LevelUp>, up: LevelUp) => {
    if ((into.get(up.subject)?.level ?? 0) < up.level) into.set(up.subject, up)
  }

  for (const event of batches.flat()) {
    switch (event.kind) {
      case 'journey_summary':
        event.stamps.forEach((s) => stamps.add(s))
        event.genre_levels.forEach((up) => raise(genres, up))
        event.decade_levels.forEach((up) => raise(decades, up))
        break
      case 'country_stamp':
        stamps.add(event.subject)
        break
      case 'genre_level':
        raise(genres, event)
        break
      case 'decade_level':
        raise(decades, event)
        break
      default: {
        const before = sets.get(event.set_id)
        const best =
          before && SET_RANK[before.kind] > SET_RANK[event.kind] ? before.kind : event.kind
        sets.set(event.set_id, {
          ...event,
          kind: best,
          new_films: [...(before?.new_films ?? []), ...event.new_films],
        })
      }
    }
  }

  const merged = [...sets.values()]
  const summary: JourneySummaryEvent = {
    kind: 'journey_summary',
    stamps: [...stamps],
    genre_levels: [...genres.values()].map(({ subject, level, level_name }) => ({
      subject,
      level,
      level_name,
    })),
    decade_levels: [...decades.values()].map(({ subject, level, level_name }) => ({
      subject,
      level,
      level_name,
    })),
  }
  const journey = stamps.size || genres.size || decades.size ? [summary] : []
  // Trophies first, then the Journey, then plain set progress (as the API orders them).
  return [
    ...merged.filter((e) => e.kind !== 'set_progressed'),
    ...journey,
    ...merged.filter((e) => e.kind === 'set_progressed'),
  ]
}
