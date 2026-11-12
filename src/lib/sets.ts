import type { SetSummary } from '@/api/types'

/** A Best Picture set on a small tile: "2011" over "83rd Oscars", or "1990s" over "Winners". */
export interface AwardTile {
  set: SetSummary
  big: string
  small: string
}

export interface SetGroups {
  /** Franchises and directors, as ticket piles. */
  piles: SetSummary[]
  /** Every Best Picture winner, as a pile of its own. */
  allWinners: SetSummary | null
  decades: AwardTile[]
  /** One per ceremony, oldest first. */
  ceremonies: AwardTile[]
}

// The award sets' keys come from app/awards.py: best-picture-winners,
// best-picture-winners-1990s and best-picture-oscars-83.
const DECADE = /^best-picture-winners-(\d{4}s)$/
const CEREMONY = /^best-picture-oscars-(\d+)$/

export function groupSets(sets: SetSummary[]): SetGroups {
  const groups: SetGroups = { piles: [], allWinners: null, decades: [], ceremonies: [] }
  const numbers = new Map<number, number>()
  for (const set of sets) {
    const decade = DECADE.exec(set.key)
    const ceremony = CEREMONY.exec(set.key)
    if (set.kind !== 'awards') groups.piles.push(set)
    else if (set.key === 'best-picture-winners') groups.allWinners = set
    else if (decade) groups.decades.push({ set, big: decade[1]!, small: 'Winners' })
    else if (ceremony) {
      // "Best Picture 2011 · 83rd Oscars"
      const [year = set.title, nth = ''] = set.title.replace(/^Best Picture /, '').split(' · ')
      groups.ceremonies.push({ set, big: year, small: nth })
      numbers.set(set.id, Number(ceremony[1]))
    } else groups.piles.push(set)
  }
  groups.ceremonies.sort((a, b) => numbers.get(a.set.id)! - numbers.get(b.set.id)!)
  return groups
}

/** Ceremonies by the decade they were held in (1950 for 1950–1959), oldest first. */
export function byDecade(ceremonies: AwardTile[]): Map<number, AwardTile[]> {
  const decades = new Map<number, AwardTile[]>()
  for (const tile of ceremonies) {
    const decade = Math.floor(Number(tile.big) / 10) * 10
    decades.set(decade, [...(decades.get(decade) ?? []), tile])
  }
  return decades
}

/** Sets that belong together, in order, for stepping through with previous and next. */
export interface Series {
  name: string
  items: { set: SetSummary; label: string }[]
}

export function seriesOf(sets: SetSummary[]): Series[] {
  const g = groupSets(sets)
  const winners = [
    ...(g.allWinners ? [{ set: g.allWinners, label: 'Every winner' }] : []),
    ...g.decades.map((t) => ({ set: t.set, label: t.big })),
  ]
  return [
    { name: 'Franchises & directors', items: g.piles.map((set) => ({ set, label: set.title })) },
    { name: 'Best Picture winners', items: winners },
    {
      name: 'Best Picture by year',
      items: g.ceremonies.map((t) => ({ set: t.set, label: t.big })),
    },
  ].filter((s) => s.items.length)
}

export interface Neighbours {
  series: string
  /** 1-based place in the series, and how many it has. */
  position: number
  count: number
  prev: { set: SetSummary; label: string } | null
  next: { set: SetSummary; label: string } | null
}

export function neighbours(sets: SetSummary[], id: number): Neighbours | null {
  for (const series of seriesOf(sets)) {
    const i = series.items.findIndex((item) => item.set.id === id)
    if (i === -1) continue
    return {
      series: series.name,
      position: i + 1,
      count: series.items.length,
      prev: series.items[i - 1] ?? null,
      next: series.items[i + 1] ?? null,
    }
  }
  return null
}
