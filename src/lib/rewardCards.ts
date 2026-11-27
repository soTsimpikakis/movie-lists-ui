import type { RewardCard, RewardEvent, SetRewardEvent } from '@/api/types'

// One film can move several sets at once (Parasite: its year, the 2010s winners, every
// winner), and a bulk save dozens. Past this many, plain progress folds into one card.
const MAX_PROGRESS_CARDS = 2

// Every event kind this frontend can show. Typed as a record so a kind added to RewardEvent
// fails to compile until it's listed here (and handled in rewardCopy and mergeEvents).
const KINDS: Record<RewardEvent['kind'], true> = {
  set_progressed: true,
  set_completed: true,
  set_polished: true,
  easter_egg: true,
  mission: true,
  feat: true,
  log_milestone: true,
  film_milestone: true,
  watch_time: true,
  genre_level: true,
  decade_level: true,
  country_stamp: true,
  keyword_level: true,
  journey_summary: true,
}

/** Drops events of a kind this frontend doesn't know (an API deployed ahead of it), so they
 * can't break the reward cards; they're still earned and show on the Journey. */
export const knownEvents = (events: RewardEvent[]) =>
  events.filter((e) => Object.prototype.hasOwnProperty.call(KINDS, (e as { kind: string }).kind))

const nearness = (e: SetRewardEvent) => (e.total - e.watched) / e.total

/**
 * The cards to show for some reward events: trophies and the Journey as they are; set
 * progress as one card for the set closest to done, the rest on a single summary card.
 */
export function toCards(events: RewardEvent[]): RewardCard[] {
  events = knownEvents(events)
  const progress = events.filter((e): e is SetRewardEvent => e.kind === 'set_progressed')
  if (progress.length <= MAX_PROGRESS_CARDS) return events
  const [closest, ...rest] = [...progress].sort(
    (a, b) => nearness(a) - nearness(b) || a.total - b.total,
  )
  return [
    ...events.filter((e) => e.kind !== 'set_progressed'),
    closest!,
    {
      kind: 'sets_summary',
      sets: rest.map(({ set_id, title, watched, total }) => ({ set_id, title, watched, total })),
    },
  ]
}
