import { describe, expect, it } from 'vitest'

import type { SetSummary } from '@/api/types'
import { byDecade, groupSets, neighbours } from '@/lib/sets'

let nextId = 1
function set(key: string, title: string, kind: SetSummary['kind'] = 'awards'): SetSummary {
  return { id: nextId++, key, title, kind, theme_key: null, total: 5, watched: 0, trophy: null }
}

const starWars = set('star-wars', 'Star Wars', 'franchise')
const tarantino = set('tarantino', 'Tarantino', 'director')
const allWinners = set('best-picture-winners', 'Every Best Picture winner')
const nineties = set('best-picture-winners-1990s', 'Best Picture winners: 1990s')
const second = set('best-picture-oscars-2', 'Best Picture 1930 · 2nd Oscars')
const eightyThird = set('best-picture-oscars-83', 'Best Picture 2011 · 83rd Oscars')
const third = set('best-picture-oscars-3', 'Best Picture 1930 · 3rd Oscars')
const sets = [starWars, tarantino, allWinners, nineties, second, eightyThird, third]

describe('groupSets', () => {
  it('splits piles, every winner, decades and ceremonies (oldest first)', () => {
    const groups = groupSets(sets)
    expect(groups.piles.map((s) => s.key)).toEqual(['star-wars', 'tarantino'])
    expect(groups.allWinners?.key).toBe('best-picture-winners')
    expect(groups.decades.map((t) => [t.big, t.small])).toEqual([['1990s', 'Winners']])
    expect(groups.ceremonies.map((t) => [t.big, t.small])).toEqual([
      ['1930', '2nd Oscars'],
      ['1930', '3rd Oscars'],
      ['2011', '83rd Oscars'],
    ])
  })

  it('keeps an award set it does not recognise as a pile', () => {
    expect(groupSets([set('golden-globes', 'Golden Globes')]).piles).toHaveLength(1)
  })

  it('puts ceremonies in the decade they were held', () => {
    const decades = byDecade(groupSets(sets).ceremonies)
    expect([...decades.keys()]).toEqual([1930, 2010])
    expect(decades.get(1930)!.map((t) => t.small)).toEqual(['2nd Oscars', '3rd Oscars'])
  })
})

describe('neighbours', () => {
  it('steps through a series in order', () => {
    expect(neighbours(sets, third.id)).toEqual({
      series: 'Best Picture by year',
      position: 2,
      count: 3,
      prev: { set: second, label: '1930' },
      next: { set: eightyThird, label: '2011' },
    })
  })

  it('stops at the ends and keeps series apart', () => {
    const first = neighbours(sets, starWars.id)!
    expect([first.prev, first.next?.set.key]).toEqual([null, 'tarantino'])
    expect(neighbours(sets, tarantino.id)!.next).toBeNull()
    const winners = neighbours(sets, allWinners.id)!
    expect([winners.series, winners.next?.label]).toEqual(['Best Picture winners', '1990s'])
  })

  it('knows nothing of a set it was not given', () => {
    expect(neighbours(sets, 999)).toBeNull()
  })
})
