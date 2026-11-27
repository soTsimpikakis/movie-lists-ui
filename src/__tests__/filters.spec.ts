import { describe, expect, it } from 'vitest'

import type { Person } from '@/api/types'
import { browseParams, emptyFilters, isFiltering, roleLabel, type Filters } from '@/lib/filters'

const person = { id: 525, name: 'Christopher Nolan' } as Person

const filters = (o: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...o })

describe('filters', () => {
  it('start empty, sorted by most seen', () => {
    expect(emptyFilters()).toEqual({
      person: null,
      role: null,
      yearFrom: null,
      yearTo: null,
      genre: null,
      keyword: null,
      sort: 'popular',
      hideSeen: false,
    })
    // A fresh object each time, so one browse can't change another's.
    expect(emptyFilters()).not.toBe(emptyFilters())
  })

  it('names roles, and passes an unknown department through', () => {
    expect(roleLabel('Sound')).toBe('Music')
    expect(roleLabel('Directing')).toBe('Directing')
    expect(roleLabel('Visual Effects')).toBe('Visual Effects')
  })

  it('counts sort and hide-seen as preferences, not filters', () => {
    expect(isFiltering(filters({ sort: 'rating', hideSeen: true }))).toBe(false)
    expect(isFiltering(filters({ person }))).toBe(true)
    expect(isFiltering(filters({ yearFrom: 1990 }))).toBe(true)
    expect(isFiltering(filters({ yearTo: 1999 }))).toBe(true)
    expect(isFiltering(filters({ genre: 27 }))).toBe(true)
    expect(isFiltering(filters({ keyword: 4344 }))).toBe(true)
  })

  it('sends only what is set', () => {
    expect(browseParams(emptyFilters(), 1).toString()).toBe('page=1&sort=popular')
    const all = filters({
      person,
      role: 'Writing',
      yearFrom: 1990,
      yearTo: 1999,
      genre: 27,
      sort: 'newest',
    })
    expect(Object.fromEntries(browseParams(all, 3))).toEqual({
      page: '3',
      sort: 'newest',
      person: '525',
      role: 'Writing',
      year_from: '1990',
      year_to: '1999',
      genre: '27',
    })
    expect(browseParams(filters({ keyword: 4344 }), 1).get('keyword')).toBe('4344')
  })

  it("leaves out a role without a person, and hide-seen (it's done in the app)", () => {
    const params = browseParams(filters({ role: 'Acting', hideSeen: true }), 1)
    expect(params.has('role')).toBe(false)
    expect(params.has('hideSeen')).toBe(false)
    expect(params.has('hide_seen')).toBe(false)
  })
})
