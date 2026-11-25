import type { MonthCount, Watch } from '@/api/types'

export interface DiaryMonth {
  /** "2026-11" */
  key: string
  /** "November" */
  name: string
  /** Every watch that month, loaded or not. */
  count: number
  items: Watch[]
}

export interface DiaryYear {
  year: string
  count: number
  months: DiaryMonth[]
}

const monthName = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })

/**
 * The loaded diary pages as years and months, in the order the API sends them (newest
 * first). Counts come from the API's month totals, so a month cut off by "Load more" still
 * shows its full count; undated watches are skipped.
 */
export function toDiary(watches: Watch[], months: MonthCount[]): DiaryYear[] {
  const totals = new Map(months.map((m) => [m.month, m.count]))
  const years: DiaryYear[] = []
  for (const watch of watches) {
    if (!watch.watched_on) continue
    const key = watch.watched_on.slice(0, 7)
    const year = key.slice(0, 4)
    let y = years[years.length - 1]
    if (y?.year !== year) {
      y = { year, count: 0, months: [] }
      years.push(y)
    }
    let m = y.months[y.months.length - 1]
    if (m?.key !== key) {
      m = { key, name: monthName(key), count: totals.get(key) ?? 0, items: [] }
      y.months.push(m)
    }
    m.items.push(watch)
  }
  for (const y of years) {
    for (const m of y.months) m.count = Math.max(m.count, m.items.length)
    const fromApi = months
      .filter((m) => m.month.startsWith(`${y.year}-`))
      .reduce((sum, m) => sum + m.count, 0)
    y.count = Math.max(
      fromApi,
      y.months.reduce((sum, m) => sum + m.count, 0),
    )
  }
  return years
}
