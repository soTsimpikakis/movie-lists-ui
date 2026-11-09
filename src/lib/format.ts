/** "2026-11-09" -> "09-11-2026" (design.md §5.1: dates display as DD-MM-YYYY). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}-${month}-${year}`
}

/** Today's date in the user's own timezone, as an ISO date. */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd". */
export function ordinal(n: number): string {
  const teens = n % 100 >= 11 && n % 100 <= 13
  const suffix = teens ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

export function posterUrl(path: string | null, size: 'w92' | 'w185' | 'w342' = 'w185') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}
