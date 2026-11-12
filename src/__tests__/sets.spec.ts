import { describe, expect, it } from 'vitest'

import type { SetSummary } from '@/api/types'
import { groupSets } from '@/lib/sets'

let nextId = 1
function set(key: string, title: string, kind: SetSummary['kind'] = 'awards'): SetSummary {
  return { id: nextId++, key, title, kind, theme_key: null, total: 5, watched: 0, trophy: null }
}

describe('groupSets', () => {
  it('splits piles, every winner, decades and ceremonies (newest first)', () => {
    const groups = groupSets([
      set('star-wars', 'Star Wars', 'franchise'),
      set('best-picture-winners', 'Every Best Picture winner'),
      set('best-picture-winners-1990s', 'Best Picture winners: 1990s'),
      set('best-picture-oscars-2', 'Best Picture 1930 · 2nd Oscars'),
      set('best-picture-oscars-83', 'Best Picture 2011 · 83rd Oscars'),
      set('best-picture-oscars-3', 'Best Picture 1930 · 3rd Oscars'),
    ])
    expect(groups.piles.map((s) => s.key)).toEqual(['star-wars'])
    expect(groups.allWinners?.key).toBe('best-picture-winners')
    expect(groups.decades.map((t) => [t.big, t.small])).toEqual([['1990s', 'Winners']])
    expect(groups.ceremonies.map((t) => [t.big, t.small])).toEqual([
      ['2011', '83rd Oscars'],
      ['1930', '3rd Oscars'],
      ['1930', '2nd Oscars'],
    ])
  })

  it('keeps an award set it does not recognise as a pile', () => {
    expect(groupSets([set('golden-globes', 'Golden Globes')]).piles).toHaveLength(1)
  })
})
