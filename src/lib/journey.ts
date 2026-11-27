import type { JourneyLevel } from '@/api/types'

// Journey helpers (design.md §12, 6B). Level names mirror app/journey.py on the backend.
export const LEVEL_NAMES = ['Novice', 'Buff', 'Connoisseur', 'Master', 'Legend']

let regions: Intl.DisplayNames | undefined
try {
  regions = new Intl.DisplayNames(['en'], { type: 'region' })
} catch {
  // Very old browsers: fall back to the code.
}

/** "KR" -> "South Korea". */
export function countryName(code: string): string {
  try {
    return regions?.of(code) ?? code
  } catch {
    return code
  }
}

/** "1990" -> "1990s". */
export function decadeLabel(decade: string): string {
  return `${decade}s`
}

/** "3 films", "1 film". */
export function films(n: number): string {
  return `${n} film${n === 1 ? '' : 's'}`
}

/** Progress from this level's threshold to the next, 0–100. */
export function toNext(entry: Pick<JourneyLevel, 'count' | 'level_at' | 'next_at'>): number {
  if (entry.next_at === null) return 100
  const from = entry.level_at
  return Math.min(100, Math.round((100 * (entry.count - from)) / (entry.next_at - from)))
}

/** "3 to Buff", or "Top level" past the last. */
export function nextLabel(entry: Pick<JourneyLevel, 'count' | 'level' | 'next_at'>): string {
  if (entry.next_at === null) return 'Top level'
  return `${entry.next_at - entry.count} to ${LEVEL_NAMES[entry.level]}`
}

/** Every decade from the 1920s (or earlier, if watched) to `year`'s, watched or not. */
export function fillEras(watchedEras: JourneyLevel[], year: number): JourneyLevel[] {
  const watched = new Map(watchedEras.map((e) => [e.subject, e]))
  const first = Math.min(1920, ...[...watched.keys()].map(Number))
  const last = Math.floor(year / 10) * 10
  const out: JourneyLevel[] = []
  for (let decade = first; decade <= last; decade += 10) {
    const key = String(decade)
    out.push(
      watched.get(key) ?? {
        subject: key,
        count: 0,
        level: 0,
        level_name: null,
        level_at: 0,
        next_at: 5,
      },
    )
  }
  return out
}

/** How far `count` is from the last landmark reached (`at`) to the next, 0–100. */
export function landmarkPercent(count: number, at: number, next: number | null): number {
  if (next === null) return 100
  return Math.min(100, Math.max(0, ((count - at) / (next - at)) * 100))
}
