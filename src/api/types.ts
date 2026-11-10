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
  /** The ticket's serial: the user's Nth logged watch, by when it was added. */
  serial: number
  film: Film
}

/** A page of the Watched list; `next_offset` is null on the last page. */
export interface WatchPage {
  items: Watch[]
  next_offset: number | null
  dated_total: number
  undated_total: number
}

export interface LibraryFilm {
  film: Film
  watch_count: number
  latest_watch_id: number
}

export interface LibraryPage {
  items: LibraryFilm[]
  next_offset: number | null
  total: number
}

export interface SetSummary {
  id: number
  key: string
  title: string
  kind: 'franchise' | 'director'
  theme_key: string | null
  total: number
  watched: number
  /** Gold: every film watched. Silver: completed once, but a film was added since. */
  trophy: 'gold' | 'silver' | null
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

/** What a new watch changed (design.md §6.3), shown as reward cards. */
export interface RewardEvent {
  kind: 'set_progressed' | 'set_completed' | 'set_polished'
  set_id: number
  title: string
  theme_key: string | null
  watched: number
  total: number
  new_films: string[]
}

export interface LoggedWatch extends Watch {
  events: RewardEvent[]
}

export interface SeenResult {
  added: number
  events: RewardEvent[]
}

/** A person to filter by (e.g. a director), from TMDB. */
export interface Person {
  id: number
  name: string
  department: string | null
  known_for: string[]
}

export interface Genre {
  id: number
  name: string
}

/** A page of films matching director / year / genre filters. */
export interface BrowsePage {
  results: SearchResult[]
  page: number
  total_pages: number
  total: number
}
