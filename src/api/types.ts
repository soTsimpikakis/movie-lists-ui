export interface SearchResult {
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
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

export interface Reaction {
  key: string
  emoji: string
  label: string
}
