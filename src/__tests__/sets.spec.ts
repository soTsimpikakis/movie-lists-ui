import { describe, expect, it } from 'vitest'

import type { SetSummary } from '@/api/types'
import { byDecade, neighbours, shelves } from '@/lib/sets'

let nextId = 1
function set(key: string, kind: SetSummary['kind'], o: Partial<SetSummary> = {}): SetSummary {
  return {
    id: nextId++,
    key,
    title: key,
    kind,
    theme_key: null,
    group_key: null,
    group_title: null,
    section: null,
    label: null,
    sublabel: null,
    total: 5,
    watched: 0,
    trophy: null,
    ...o,
  }
}

const bp = { group_key: 'best-picture', group_title: 'Best Picture' }
const mcu = { group_key: 'mcu', group_title: 'MCU' }
const starWars = set('star-wars', 'franchise')
const everyMcu = set('mcu', 'franchise', mcu)
const phase1 = set('mcu-1', 'franchise', { ...mcu, section: 'Phases', label: 'Phase One' })
const phase2 = set('mcu-2', 'franchise', { ...mcu, section: 'Phases', label: 'Phase Two' })
const tarantino = set('tarantino', 'director', { trophy: 'gold' })
const allWinners = set('bp', 'awards', bp)
const nineties = set('bp-1990s', 'awards', { ...bp, section: 'Winners by decade', label: '1990s' })
const year = (label: string, sublabel: string) =>
  set(`bp-${sublabel}`, 'awards', { ...bp, section: 'Nominees by year', label, sublabel })
const second = year('1930', '2nd')
const third = year('1930', '3rd')
const eightyThird = year('2011', '83rd')
// In seed order, as the API lists them, with a director in among the franchises.
const sets = [
  starWars,
  everyMcu,
  phase1,
  tarantino,
  phase2,
  allWinners,
  nineties,
  second,
  third,
  eightyThird,
]

describe('shelves', () => {
  it('puts sets on a shelf per kind, lone sets apart from groups', () => {
    const [franchises, directors, awards] = shelves(sets)
    expect(shelves(sets).map((s) => s.title)).toEqual(['Franchises', 'Directors', 'Awards'])
    expect(franchises!.standalone).toEqual([starWars])
    const [group] = franchises!.groups
    expect([group!.title, group!.lead, group!.sets]).toEqual([
      'MCU',
      everyMcu,
      [everyMcu, phase1, phase2],
    ])
    expect(group!.sections.map((s) => [s.name, s.sets.length])).toEqual([['Phases', 2]])
    expect(directors!.sets).toEqual([tarantino])
    expect(awards!.groups[0]!.sections.map((s) => s.name)).toEqual([
      'Winners by decade',
      'Nominees by year',
    ])
  })

  it('leaves out empty shelves', () => {
    expect(shelves([tarantino]).map((s) => s.kind)).toEqual(['director'])
  })
})

describe('byDecade', () => {
  const section = (s: SetSummary[]) => ({ name: 'Nominees by year', sets: s })

  it('splits a long section of years into decades', () => {
    const many = Array.from({ length: 16 }, (_, i) => year(String(1990 + i), `${i}`))
    expect([...byDecade(section(many))!.keys()]).toEqual([1990, 2000])
  })

  it('leaves short sections, and labels that are not years, alone', () => {
    expect(byDecade(section([second, third]))).toBeNull()
    const phases = Array.from({ length: 16 }, (_, i) => set(`p${i}`, 'franchise', { label: 'P' }))
    expect(byDecade(section(phases))).toBeNull()
  })
})

describe('neighbours', () => {
  it('steps through a section in order', () => {
    expect(neighbours(sets, third.id)).toEqual({
      series: 'Best Picture · Nominees by year',
      shelf: 'awards',
      position: 2,
      count: 3,
      prev: { set: second, label: '1930' },
      next: { set: eightyThird, label: '2011' },
    })
  })

  it('leads into the first section from the group lead', () => {
    const lead = neighbours(sets, everyMcu.id)!
    expect([lead.series, lead.prev, lead.next?.label]).toEqual(['MCU · Phases', null, 'Phase One'])
    expect(neighbours(sets, allWinners.id)!.next?.label).toBe('1990s')
  })

  it('keeps lone sets on their shelf, and series apart', () => {
    const sw = neighbours(sets, starWars.id)!
    expect([sw.series, sw.count, sw.next]).toEqual(['Franchises', 1, null])
    expect(neighbours(sets, tarantino.id)!.shelf).toBe('director')
    expect(neighbours(sets, 999)).toBeNull()
  })
})
