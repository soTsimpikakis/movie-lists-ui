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
export interface MonthCount {
  /** "2026-11" */
  month: string
  count: number
}

/** A page of the diary: dated watches only, newest watch date first. */
export interface WatchPage {
  items: Watch[]
  next_offset: number | null
  dated_total: number
  undated_total: number
  /** Watches per month, newest first, for every month (not just this page). */
  months: MonthCount[]
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
  kind: 'franchise' | 'director' | 'awards'
  theme_key: string | null
  /** Sets that show together on their shelf (Best Picture, the MCU); null for a lone set. */
  group_key: string | null
  group_title: string | null
  /** Its heading within the group ("Phases"); null for the group's lead set. */
  section: string | null
  /** Short text for its tile ("Phase One", "2011") and a second line ("83rd Oscars"). */
  label: string | null
  sublabel: string | null
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
  /** Singled out, e.g. the year's Best Picture winner. */
  highlight: boolean
  release_date: string | null
  /** Not out yet, so not in the set's total: shown greyed with its date. */
  upcoming: boolean
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
  kind: 'genre_level' | 'decade_level' | 'country_stamp' | 'keyword_level'
  /** A genre name, a decade ("1990"), a country code ("KR") or a keyword genre ("Heist"). */
  subject: string
  level: number
  level_name: string | null
  count: number
  next_at: number | null
}

/** Tickets logged since joining crossed a milestone: 1, 5, 10, 20… (ideabox.md). */
export interface LogMilestoneEvent {
  kind: 'log_milestone'
  milestone: number
  /** Tickets logged so far (dated watches, rewatches included). */
  count: number
  next_at: number | null
}

/** Different films in the library crossed a milestone: 10, 25, 50, 100… (ideabox.md). */
export interface FilmMilestoneEvent {
  kind: 'film_milestone'
  milestone: number
  /** Different films in the library, back-fill included. */
  count: number
  next_at: number | null
}

/** Hours of film watched crossed a checkpoint: a day, 50 hours, a week… (ideabox.md). */
export interface WatchTimeEvent {
  kind: 'watch_time'
  /** The checkpoint, in hours. */
  hours: number
  /** Hours watched so far, rounded down. */
  total_hours: number
  next_at: number | null
}

/** A hidden easter egg found by this log: the right film on the right date (design.md §6.6). */
export interface EggEvent {
  kind: 'easter_egg'
  key: string
  title: string
  lore: string | null
  hint: string | null
  /** The year of the window it was found in, for a yearly egg; null for a once-ever egg. */
  year: number | null
  /** The film whose log found it. */
  film_title: string
}

/** A mission the user joined was finished by this log, or on joining (design.md §6.6). */
export interface MissionEvent {
  kind: 'mission'
  key: string
  title: string
  finish_copy: string | null
  /** The season's year; null for an open-ended mission. */
  year: number | null
  count: number
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
  keyword_levels: LevelUp[]
}

/** What a new watch changed, shown as reward cards. */
export type RewardEvent =
  | SetRewardEvent
  | EggEvent
  | MissionEvent
  | LogMilestoneEvent
  | FilmMilestoneEvent
  | WatchTimeEvent
  | JourneyRewardEvent
  | JourneySummaryEvent

/** Set progress past the first card, folded into one by the app (lib/rewardCards.ts). */
export interface SetsSummaryEvent {
  kind: 'sets_summary'
  sets: Pick<SetRewardEvent, 'set_id' | 'title' | 'watched' | 'total'>[]
}

/** What the reward cards show: the API's events, with long runs of progress folded. */
export type RewardCard = RewardEvent | SetsSummaryEvent

export interface JourneyLevel {
  subject: string
  count: number
  level: number
  level_name: string | null
  /** Films the current level took (0 before Novice), for progress towards `next_at`. */
  level_at: number
  next_at: number | null
}

/** Everything on the Journey tab. */
export interface Journey {
  summary: {
    films: number
    watches: number
    hours: number
    this_year: number
    /** Landmarks: the last milestone reached (0 before the first) and the next (null past
     * the last). Tickets logged since joining: */
    logged: number
    log_milestone_at: number
    next_log_milestone: number | null
    /** Library size (`films`): */
    film_milestone_at: number
    next_film_milestone: number | null
    /** Watch time in hours (`hours`): */
    watch_time_at: number
    next_watch_time: number | null
    first_ticket: { title: string; watched_on: string } | null
    oldest_film: { title: string; year: number } | null
    top_reaction: { name: string; count: number } | null
    top_genre: { name: string; count: number } | null
  }
  expertise: JourneyLevel[]
  eras: JourneyLevel[]
  /** Keyword genres (Heist, Spy…) with at least one film. */
  niches: JourneyLevel[]
  passport: { code: string; count: number; stamped_at: string | null }[]
  trophies: {
    set_id: number
    title: string
    trophy: 'gold' | 'silver'
    watched: number
    total: number
  }[]
  /** Easter eggs found, newest first. Only found ones: there's no total (design.md §6.6). */
  eggs: {
    key: string
    title: string
    lore: string | null
    hint: string | null
    /** Years found, for a yearly egg (empty for a once-ever egg). */
    years: number[]
    first_found_at: string
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
  /** A TMDB keyword standing in for a genre TMDB lacks (Musical); filtered as `keyword`. */
  keyword: boolean
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

// --- Admin (design.md §6.6) -------------------------------------------------------------

/** Exactly one of these. Films are TMDB ids; a genre is its name; a keyword its TMDB id. */
export interface EggMatch {
  film?: number
  films?: number[]
  genre?: string
  keyword?: number
}

export type EggStatus = 'draft' | 'live' | 'off'
export type EggRepeat = 'once' | 'yearly'

/** What the egg form sends. */
export interface EggInput {
  key: string
  title: string
  lore: string | null
  hint: string | null
  notes: string | null
  start_month: number
  start_day: number
  end_month: number
  end_day: number
  only_year: number | null
  match: EggMatch
  min_count: number
  repeat: EggRepeat
}

export interface AdminEgg extends EggInput {
  id: number
  status: EggStatus
  live_since: string | null
  updated_at: string
  /** Titles for the films a film or list egg names. */
  films: { tmdb_id: number; title: string; year: number | null }[]
  /** Times found (users × years). */
  found: number
  /** First day of its next window; null when it has none left. */
  next_on: string | null
  /** The key can't change once the egg has gone live or been found. */
  key_locked: boolean
}

/** Past matches per window: counts only, never whose. */
export interface EggCheck {
  years: { year: number; users: number; watches: number }[]
}

export interface EggTry {
  finds: boolean
  reason: string
}

export interface AdminCommand {
  command: string
  description: string
}

export interface AdminJob {
  id: number
  command: string
  status: 'running' | 'done' | 'failed'
  output: string
  started_at: string
  finished_at: string | null
}

// --- Missions (design.md §6.6) ------------------------------------------------------------

export type GoalKind = 'count_matching' | 'all_of_list' | 'count_of_list'

/** A live mission, as a user sees it. */
export interface UserMission {
  id: number
  key: string
  title: string
  description: string
  /** The current season; both null for an open-ended mission. */
  starts_on: string | null
  ends_on: string | null
  join_until: string | null
  goal_kind: GoalKind
  /** A genre or keyword genre name, for count goals. */
  goal_subject: string | null
  films: { tmdb_id: number; title: string; year: number | null; seen: boolean }[]
  rewatches_count: boolean
  needed: number
  joined: boolean
  joinable: boolean
  done: number
  finished: boolean
}

export interface MissionsPage {
  missions: UserMission[]
  finished: { key: string; title: string; year: number | null; earned_at: string }[]
}

export interface MissionGoal {
  kind: GoalKind
  count?: number
  genre?: string
  keyword?: number
  films?: number[]
}

/** What the mission form sends. */
export interface MissionInput {
  key: string
  title: string
  description: string
  finish_copy: string | null
  notes: string | null
  starts_on: string | null
  ends_on: string | null
  repeats_yearly: boolean
  join_until: string | null
  announce_from: string | null
  goal: MissionGoal
  set_id: number | null
  rewatches_count: boolean
}

export interface AdminMission extends MissionInput {
  id: number
  status: EggStatus
  live_since: string | null
  updated_at: string
  films: { tmdb_id: number; title: string; year: number | null }[]
  season_start: string | null
  season_end: string | null
  joined: number
  finished: number
  key_locked: boolean
}

/** If everyone had joined the latest season: counts only. */
export interface MissionCheck {
  season_start: string | null
  season_end: string | null
  finished: number
  started: number
}
