import { describe, expect, it } from 'vitest'

import type { JourneyLevel } from '@/api/types'
import {
  countryName,
  decadeLabel,
  films,
  fillEras,
  landmarkPercent,
  nextLabel,
  toNext,
} from '@/lib/journey'

const level = (fields: Partial<JourneyLevel> = {}): JourneyLevel => ({
  subject: 'Horror',
  count: 7,
  level: 1,
  level_name: 'Novice',
  level_at: 5,
  next_at: 15,
  ...fields,
})

describe('journey', () => {
  it('measures progress from this level to the next', () => {
    expect(toNext(level())).toBe(20)
    expect(toNext(level({ count: 6, level_at: 5, next_at: 8 }))).toBe(33)
    expect(toNext(level({ count: 0, level: 0, level_at: 0, next_at: 5 }))).toBe(0)
    expect(toNext(level({ next_at: null }))).toBe(100)
  })

  it('says how many films to the next level', () => {
    expect(nextLabel(level())).toBe('8 to Buff')
    expect(nextLabel(level({ count: 2, level: 0, next_at: 5 }))).toBe('3 to Novice')
    expect(nextLabel(level({ next_at: null }))).toBe('Top level')
  })

  it('fills in every decade from the 1920s to now', () => {
    const nineties = level({ subject: '1990', count: 12 })
    const eras = fillEras([nineties], 2026)
    expect(eras.map((e) => e.subject)).toEqual([
      '1920',
      '1930',
      '1940',
      '1950',
      '1960',
      '1970',
      '1980',
      '1990',
      '2000',
      '2010',
      '2020',
    ])
    expect(eras[7]).toBe(nineties)
    expect(eras[0]).toEqual({
      subject: '1920',
      count: 0,
      level: 0,
      level_name: null,
      level_at: 0,
      next_at: 5,
    })
  })

  it('starts the eras earlier for an older film', () => {
    expect(fillEras([level({ subject: '1900' })], 1925).map((e) => e.subject)).toEqual([
      '1900',
      '1910',
      '1920',
    ])
  })

  it('places a landmark between the last reached and the next', () => {
    expect(landmarkPercent(15, 10, 20)).toBe(50)
    expect(landmarkPercent(12, 10, 25)).toBeCloseTo(13.33, 2)
    expect(landmarkPercent(1100, 1000, null)).toBe(100)
    expect(landmarkPercent(3, 5, 10)).toBe(0)
    expect(landmarkPercent(30, 10, 20)).toBe(100)
  })
})

describe('journey words', () => {
  it('names countries, and falls back to the code for one it cannot name', () => {
    expect(countryName('KR')).toBe('South Korea')
    expect(countryName('not a code')).toBe('not a code')
    expect(countryName('')).toBe('')
  })

  it('counts films and labels decades', () => {
    expect([films(0), films(1), films(2)]).toEqual(['0 films', '1 film', '2 films'])
    expect(decadeLabel('1990')).toBe('1990s')
  })
})
