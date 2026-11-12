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
  /** Which of the person's roles to list ("Acting", "Directing"...); null for their main one. */
  role: string | null
  yearFrom: number | null
  yearTo: number | null
  genre: number | null
  sort: Sort
  /** Leave out films already in the library. Done in the app, so saving films mid-browse
   * can't shift the pages still to load. */
  hideSeen: boolean
}

export function emptyFilters(): Filters {
  return {
    person: null,
    role: null,
    yearFrom: null,
    yearTo: null,
    genre: null,
    sort: 'popular',
    hideSeen: false,
  }
}

/** What a person's films are, by TMDB department. */
export const ROLES: Record<string, { label: string; chip: string }> = {
  Acting: { label: 'Acting', chip: 'With' },
  Directing: { label: 'Directing', chip: 'Dir.' },
  Sound: { label: 'Music', chip: 'Music' },
  Writing: { label: 'Writing', chip: 'Writer' },
  Production: { label: 'Producing', chip: 'Prod.' },
  Camera: { label: 'Camera', chip: 'Camera' },
  Editing: { label: 'Editing', chip: 'Editor' },
}

export function roleLabel(role: string): string {
  return ROLES[role]?.label ?? role
}

/** Sort and hide-seen are preferences, not filters: on their own they don't browse. */
export function isFiltering(f: Filters): boolean {
  return Boolean(f.person || f.yearFrom || f.yearTo || f.genre)
}

export function browseParams(f: Filters, page: number): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), sort: f.sort })
  if (f.person) params.set('person', String(f.person.id))
  if (f.person && f.role) params.set('role', f.role)
  if (f.yearFrom) params.set('year_from', String(f.yearFrom))
  if (f.yearTo) params.set('year_to', String(f.yearTo))
  if (f.genre) params.set('genre', String(f.genre))
  return params
}
