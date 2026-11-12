import type { RewardCard, RewardEvent, SetRewardEvent } from '@/api/types'

// One film can move several sets at once (Parasite: its year, the 2010s winners, every
// winner), and a bulk save dozens. Past this many, plain progress folds into one card.
const MAX_PROGRESS_CARDS = 2

const nearness = (e: SetRewardEvent) => (e.total - e.watched) / e.total

/**
 * The cards to show for some reward events: trophies and the Journey as they are; set
 * progress as one card for the set closest to done, the rest on a single summary card.
 */
export function toCards(events: RewardEvent[]): RewardCard[] {
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
