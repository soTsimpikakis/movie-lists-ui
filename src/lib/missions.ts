import type { AdminMission, Genre, GoalKind } from '@/api/types'
import { MONTHS } from '@/lib/eggs'

// Words for missions (design.md §6.6): the season and the goal, plainly.

const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y: y!, m: m!, d: d! }
}

/** "18–31 Dec", "30 Dec – 2 Jan", "Open-ended" (no dates). */
export function seasonText(start: string | null, end: string | null): string {
  if (!start || !end) return 'Open-ended'
  const a = parts(start)
  const b = parts(end)
  if (a.y === b.y && a.m === b.m) {
    return a.d === b.d ? `${a.d} ${MONTHS[a.m - 1]}` : `${a.d}–${b.d} ${MONTHS[a.m - 1]}`
  }
  return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]}`
}

/** "3 Christmas films", "All 4 films", "5 of these 12 films". */
export function goalText(goal: {
  goal_kind: GoalKind
  goal_subject: string | null
  needed: number
  listed: number
}): string {
  const n = goal.needed
  const films = n === 1 ? 'film' : 'films'
  if (goal.goal_kind === 'count_matching')
    return `${n} ${goal.goal_subject ?? ''} ${films}`.replace('  ', ' ')
  if (goal.goal_kind === 'all_of_list') return `All ${n} ${films}`
  return `${n} of these ${goal.listed} films`
}

/** A mission's goal in the admin list: "3 × Horror", "3 × Christmas" (a keyword, by name),
 * "All of 4 films", "5 of a set". */
export function adminGoalText(
  mission: Pick<AdminMission, 'goal' | 'set_id'>,
  genres: Genre[] = [],
): string {
  const g = mission.goal
  const listed = mission.set_id ? 'a set' : `${g.films?.length ?? 0} films`
  if (g.kind === 'count_matching') {
    const name =
      g.genre ?? genres.find((k) => k.keyword && k.id === g.keyword)?.name ?? `keyword ${g.keyword}`
    return `${g.count} × ${name}`
  }
  if (g.kind === 'all_of_list') return `All of ${listed}`
  return `${g.count} of ${listed}`
}
