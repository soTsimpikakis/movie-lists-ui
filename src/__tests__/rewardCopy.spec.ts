import { describe, expect, it } from 'vitest'

import type { RewardEvent } from '@/api/types'
import { rewardCopy } from '@/lib/rewardCopy'

const event = (overrides: Partial<RewardEvent>): RewardEvent => ({
  kind: 'set_progressed',
  set_id: 1,
  title: 'The Matrix',
  theme_key: null,
  watched: 2,
  total: 4,
  new_films: ['The Matrix Reloaded'],
  ...overrides,
})

describe('rewardCopy', () => {
  it('counts what is left on a progressed set', () => {
    expect(rewardCopy(event({})).body).toBe('One more hole punched: 2 of 4, 2 to go.')
    expect(rewardCopy(event({ new_films: ['A', 'B'] })).body).toMatch(/^2 more holes punched/)
  })

  it('awards gold on completion and on polish', () => {
    expect(rewardCopy(event({ kind: 'set_completed', watched: 4 })).headline).toBe('Gold trophy!')
    const polished = rewardCopy(
      event({ kind: 'set_polished', watched: 4, new_films: ['Resurrections'] }),
    )
    expect(polished.headline).toBe('Back to gold')
    expect(polished.body).toContain('Resurrections caught you up with The Matrix')
  })

  it('uses themed lines for themed sets', () => {
    const done = rewardCopy(
      event({ kind: 'set_completed', theme_key: 'star-wars', title: 'Star Wars' }),
    )
    expect(done.body).toContain('The Force is strong with this one.')
  })
})
