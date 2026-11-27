import type { AdminEgg, EggEvent, EggInput, EggMatch, Genre } from '@/api/types'

// Words for easter eggs in the admin view (design.md §6.6).

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Days in a month, counting 29 Feb (an egg's dates repeat every year). */
export const daysIn = (month: number) => new Date(2024, month, 0).getDate()

type Dates = Pick<EggInput, 'start_month' | 'start_day' | 'end_month' | 'end_day' | 'only_year'>

const day = (month: number, d: number) => `${d} ${MONTHS[month - 1]}`

/** "5 Nov", "24–26 Dec", "30 Dec – 2 Jan", with "2015 only" for an anniversary. */
export function whenText(egg: Dates): string {
  const { start_month: sm, start_day: sd, end_month: em, end_day: ed } = egg
  let when: string
  if (sm === em && sd === ed) when = day(sm, sd)
  else if (sm === em && sd < ed) when = `${sd}–${ed} ${MONTHS[sm - 1]}`
  else when = `${day(sm, sd)} – ${day(em, ed)}`
  return egg.only_year ? `${when}, ${egg.only_year} only` : when
}

export type MatchKind = 'film' | 'films' | 'genre' | 'keyword'

export function matchKind(match: EggMatch): MatchKind {
  if (match.films) return 'films'
  if (match.genre) return 'genre'
  if (match.keyword !== undefined) return 'keyword'
  return 'film'
}

/** "Die Hard", "Any of 3 films", "Any Horror film", "Any Christmas film"; "3 × …" with a count. */
export function matchText(
  egg: Pick<AdminEgg, 'match' | 'films' | 'min_count'>,
  genres: Genre[] = [],
): string {
  const { match } = egg
  let what: string
  if (match.films) what = `Any of ${match.films.length} films`
  else if (match.genre) what = `Any ${match.genre} film`
  else if (match.keyword !== undefined) {
    const name = genres.find((g) => g.keyword && g.id === match.keyword)?.name
    what = `Any ${name ?? `keyword ${match.keyword}`} film`
  } else what = egg.films[0]?.title ?? `TMDB film ${match.film}`
  return egg.min_count > 1 ? `${egg.min_count} × ${what.replace(/^Any /, '')}` : what
}

/** A reward card for the preview, as a find would show it. */
export function previewEvent(egg: EggInput, filmTitle: string): EggEvent {
  return {
    kind: 'easter_egg',
    key: egg.key,
    title: egg.title || 'Untitled egg',
    lore: egg.lore?.trim() || null,
    hint: egg.hint?.trim() || null,
    year: egg.repeat === 'yearly' ? (egg.only_year ?? new Date().getFullYear()) : null,
    film_title: filmTitle,
  }
}

/** "Die Hard 2" -> "die-hard-2", for suggesting a key from the title. */
export const keyFrom = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
