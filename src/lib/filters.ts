import type { Person } from '@/api/types'

/** Orders for browsed films: most-voted (the ones people have seen), best rated, newest. */
export type Sort = 'popular' | 'rating' | 'newest'

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'popular', label: 'Most seen' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
]

export interface Filters {
  person: Person | null
  yearFrom: number | null
  yearTo: number | null
  genre: number | null
  sort: Sort
  /** Leave out films already in the library. */
  hideSeen: boolean
}

export function emptyFilters(): Filters {
  return {
    person: null,
    yearFrom: null,
    yearTo: null,
    genre: null,
    sort: 'popular',
    hideSeen: false,
  }
}

/** Sort and hide-seen are preferences, not filters: on their own they don't browse. */
export function isFiltering(f: Filters): boolean {
  return Boolean(f.person || f.yearFrom || f.yearTo || f.genre)
}

export function browseParams(f: Filters, page: number): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), sort: f.sort })
  if (f.person) params.set('person', String(f.person.id))
  if (f.yearFrom) params.set('year_from', String(f.yearFrom))
  if (f.yearTo) params.set('year_to', String(f.yearTo))
  if (f.genre) params.set('genre', String(f.genre))
  if (f.hideSeen) params.set('unseen', 'true')
  return params
}
