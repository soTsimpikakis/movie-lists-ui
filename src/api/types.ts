export interface SearchResult {
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  /** Main genre (TMDB's first); colours the ticket. */
  genre: string | null
  watch_count: number
}

export interface Film {
  id: number
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  runtime_min: number | null
  genres: string[]
  favourite: boolean
}

export interface Watch {
  id: number
  /** ISO date; null only for "before Movie Club" back-fill. */
  watched_on: string | null
  reaction: string | null
  note: string | null
  created_at: string
  watch_number: number
  film: Film
}

export interface SetSummary {
  id: number
  key: string
  title: string
  kind: 'franchise' | 'director'
  theme_key: string | null
  total: number
  watched: number
}

export interface SetFilm {
  film_id: number
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  /** Main genre (TMDB's first); colours the ticket. */
  genre: string | null
  watched: boolean
  watch_count: number
}

export interface SetDetail extends SetSummary {
  films: SetFilm[]
}

export interface ChecklistFilm {
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  /** Main genre (TMDB's first); colours the ticket. */
  genre: string | null
  seen: boolean
  watch_count: number
}

export interface Checklist {
  sets: { id: number; title: string; films: ChecklistFilm[] }[]
  popular: ChecklistFilm[]
}

export interface Reaction {
  key: string
  emoji: string
  label: string
}
