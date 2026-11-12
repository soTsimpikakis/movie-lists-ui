export interface SearchResult {
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  /** Main genre (TMDB's first); colours the ticket. */
  genre: string | null
  /** TMDB's average rating (0-10) and how many people rated it. */
  vote_average: number
  vote_count: number
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

/** A set moved, was completed, or was polished back to gold (design.md §6.2–6.3). */
export interface SetRewardEvent {
  kind: 'set_progressed' | 'set_completed' | 'set_polished'
  set_id: number
  title: string
  theme_key: string | null
  watched: number
  total: number
  new_films: string[]
}

/** A Journey level reached or a passport stamp earned by one watch (design.md §12, 6B). */
export interface JourneyRewardEvent {
  kind: 'genre_level' | 'decade_level' | 'country_stamp'
  /** A genre name, a decade ("1990") or a country code ("KR"). */
  subject: string
  level: number
  level_name: string | null
  count: number
  next_at: number | null
}

export interface LevelUp {
  subject: string
  level: number
  level_name: string | null
}

/** Everything a bulk add earned on the Journey, as one card. */
export interface JourneySummaryEvent {
  kind: 'journey_summary'
  stamps: string[]
  genre_levels: LevelUp[]
  decade_levels: LevelUp[]
}

/** What a new watch changed, shown as reward cards. */
export type RewardEvent = SetRewardEvent | JourneyRewardEvent | JourneySummaryEvent

export interface JourneyLevel {
  subject: string
  count: number
  level: number
  level_name: string | null
  next_at: number | null
}

/** Everything on the Journey tab. */
export interface Journey {
  summary: {
    films: number
    watches: number
    hours: number
    this_year: number
    first_ticket: { title: string; watched_on: string } | null
    oldest_film: { title: string; year: number } | null
    top_reaction: { name: string; count: number } | null
    top_genre: { name: string; count: number } | null
  }
  expertise: JourneyLevel[]
  eras: JourneyLevel[]
  passport: { code: string; count: number; stamped_at: string | null }[]
  trophies: {
    set_id: number
    title: string
    trophy: 'gold' | 'silver'
    watched: number
    total: number
  }[]
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
  /** With a person: the role their films are listed in, and the roles to switch to. */
  role: string | null
  roles: string[]
}
