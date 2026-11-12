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
  /** One per ceremony, newest first. */
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
  groups.ceremonies.sort((a, b) => numbers.get(b.set.id)! - numbers.get(a.set.id)!)
  return groups
}
