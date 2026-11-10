import type { RewardEvent } from '@/api/types'

// Card wording (design.md §6.4: quirky, a little nerdy). Sets with a theme_key get their own.
const THEMED: Record<string, Partial<Record<RewardEvent['kind'], string>>> = {
  'star-wars': {
    set_progressed: 'Stay on target.',
    set_completed: 'The Force is strong with this one.',
    set_polished: 'Balance restored to the Force.',
  },
}

export function rewardCopy(event: RewardEvent) {
  const { kind, title, watched, total, new_films: films } = event
  const left = total - watched
  const flourish = (event.theme_key && THEMED[event.theme_key]?.[kind]) || ''

  if (kind === 'set_completed') {
    return {
      label: 'Set complete',
      headline: 'Gold trophy!',
      body: `You've watched every film in ${title}. ${flourish || 'Take a bow.'}`,
    }
  }
  if (kind === 'set_polished') {
    return {
      label: 'Polished',
      headline: 'Back to gold',
      body: `${films.join(' and ')} caught you up with ${title}. ${flourish || 'Shiny again.'}`,
    }
  }
  const punched =
    films.length === 1 ? 'One more hole punched' : `${films.length} more holes punched`
  return {
    label: 'Set progress',
    headline: title,
    body: `${punched}: ${watched} of ${total}, ${left} to go. ${flourish}`.trim(),
  }
}
