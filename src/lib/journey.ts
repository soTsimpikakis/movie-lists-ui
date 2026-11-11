// Journey helpers (design.md §12, 6B). Level names mirror app/journey.py on the backend.
export const LEVEL_NAMES = ['Novice', 'Buff', 'Connoisseur', 'Master', 'Legend']
/** Distinct films needed for each level. */
export const LEVEL_THRESHOLDS = [5, 15, 30, 60, 100]

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
