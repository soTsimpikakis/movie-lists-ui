import type { SetSummary } from '@/api/types'

// The Sets pages (design.md §6.1): a grid of shelves, one per kind of set. On a shelf, sets
// on their own show as piles. Grouped sets (Best Picture, the MCU) show together: the group's
// lead set as a pile, the rest as small tiles under their section ("Phases").
// Everything comes from the seed data, so a new award or franchise group needs no code here.

export type ShelfKind = SetSummary['kind']

const SHELF_ORDER: ShelfKind[] = ['franchise', 'director', 'awards']
export const SHELF_TITLES: Record<ShelfKind, string> = {
  franchise: 'Franchises',
  director: 'Directors',
  awards: 'Awards',
}

export interface Section {
  name: string
  sets: SetSummary[]
}

export interface Group {
  key: string
  title: string
  /** The set that stands for the whole group ("Every MCU film"), if it has one. */
  lead: SetSummary | null
  sections: Section[]
  /** Every set in the group, lead first. */
  sets: SetSummary[]
}

export interface Shelf {
  kind: ShelfKind
  title: string
  sets: SetSummary[]
  /** Sets in no group, as piles. */
  standalone: SetSummary[]
  groups: Group[]
}

/** The text on a small tile: its label ("Phase One", "2011"), else its title. */
export const tileLabel = (set: SetSummary) => set.label ?? set.title

/** Sets by shelf, in seed order (the API lists them that way). Empty shelves are left out. */
export function shelves(sets: SetSummary[]): Shelf[] {
  const byKind = new Map<ShelfKind, Shelf>()
  const groups = new Map<string, Group>()
  for (const set of sets) {
    let shelf = byKind.get(set.kind)
    if (!shelf) {
      shelf = {
        kind: set.kind,
        title: SHELF_TITLES[set.kind],
        sets: [],
        standalone: [],
        groups: [],
      }
      byKind.set(set.kind, shelf)
    }
    shelf.sets.push(set)
    if (!set.group_key) {
      shelf.standalone.push(set)
      continue
    }
    let group = groups.get(set.group_key)
    if (!group) {
      group = {
        key: set.group_key,
        title: set.group_title ?? set.group_key,
        lead: null,
        sections: [],
        sets: [],
      }
      groups.set(set.group_key, group)
      shelf.groups.push(group)
    }
    if (set.section === null) {
      group.lead ??= set
      continue
    }
    let section = group.sections.find((s) => s.name === set.section)
    if (!section) {
      section = { name: set.section, sets: [] }
      group.sections.push(section)
    }
    section.sets.push(set)
  }
  for (const group of groups.values()) {
    group.sets = [...(group.lead ? [group.lead] : []), ...group.sections.flatMap((s) => s.sets)]
  }
  const rank = (kind: ShelfKind) => {
    const i = SHELF_ORDER.indexOf(kind)
    return i === -1 ? SHELF_ORDER.length : i
  }
  return [...byKind.values()].sort((a, b) => rank(a.kind) - rank(b.kind))
}

export const goldCount = (sets: SetSummary[]) => sets.filter((s) => s.trophy === 'gold').length

/** A section of years ("Nominees by year") long enough to show one decade at a time. */
export function byDecade(section: Section): Map<number, SetSummary[]> | null {
  const years = section.sets.map((s) => (s.label && /^\d{4}$/.test(s.label) ? +s.label : NaN))
  if (section.sets.length <= 15 || years.some(Number.isNaN)) return null
  const decades = new Map<number, SetSummary[]>()
  section.sets.forEach((set, i) => {
    const decade = Math.floor(years[i]! / 10) * 10
    decades.set(decade, [...(decades.get(decade) ?? []), set])
  })
  return decades
}

/** Sets that belong together, in order, for stepping through with previous and next. */
export interface Series {
  name: string
  shelf: ShelfKind
  items: { set: SetSummary; label: string }[]
}

export function seriesOf(sets: SetSummary[]): Series[] {
  const series: Series[] = []
  for (const shelf of shelves(sets)) {
    series.push({
      name: shelf.title,
      shelf: shelf.kind,
      items: shelf.standalone.map((set) => ({ set, label: set.title })),
    })
    for (const group of shelf.groups) {
      // The lead steps into the first section: Every MCU film → Phase One → Phase Two…
      group.sections.forEach((section, i) => {
        const lead = i === 0 && group.lead ? [{ set: group.lead, label: group.lead.title }] : []
        series.push({
          name: `${group.title} · ${section.name}`,
          shelf: shelf.kind,
          items: [...lead, ...section.sets.map((set) => ({ set, label: tileLabel(set) }))],
        })
      })
      if (!group.sections.length && group.lead) {
        series.push({
          name: group.title,
          shelf: shelf.kind,
          items: [{ set: group.lead, label: group.lead.title }],
        })
      }
    }
  }
  return series.filter((s) => s.items.length)
}

export interface Neighbours {
  series: string
  shelf: ShelfKind
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
      shelf: series.shelf,
      position: i + 1,
      count: series.items.length,
      prev: series.items[i - 1] ?? null,
      next: series.items[i + 1] ?? null,
    }
  }
  return null
}
