import type {
  JourneyRewardEvent,
  JourneySummaryEvent,
  RewardEvent,
  SetRewardEvent,
} from '@/api/types'
import { countryName, decadeLabel, films, LEVEL_NAMES } from '@/lib/journey'

// Card wording (design.md §6.4: quirky, a little nerdy). Sets with a theme_key get their own.
const THEMED: Record<string, Partial<Record<SetRewardEvent['kind'], string>>> = {
  'star-wars': {
    set_progressed: 'Stay on target.',
    set_completed: 'The Force is strong with this one.',
    set_polished: 'Balance restored to the Force.',
  },
}

export interface Copy {
  label: string
  headline: string
  body: string
}

function setCopy(event: SetRewardEvent): Copy {
  const { kind, title, watched, total, new_films: newFilms } = event
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
      body: `${newFilms.join(' and ')} caught you up with ${title}. ${flourish || 'Shiny again.'}`,
    }
  }
  const punched =
    newFilms.length === 1 ? 'One more hole punched' : `${newFilms.length} more holes punched`
  return {
    label: 'Set progress',
    headline: title,
    body: `${punched}: ${watched} of ${total}, ${left} to go. ${flourish}`.trim(),
  }
}

function toNext(event: JourneyRewardEvent): string {
  if (event.next_at === null) return 'The top level. Legendary.'
  return `${event.next_at - event.count} more to ${LEVEL_NAMES[event.level]}.`
}

function journeyCopy(event: JourneyRewardEvent): Copy {
  if (event.kind === 'country_stamp') {
    return {
      label: 'Passport',
      headline: 'New stamp!',
      body: `Your first film from ${countryName(event.subject)}. Bon voyage.`,
    }
  }
  if (event.kind === 'decade_level') {
    const era = decadeLabel(event.subject)
    return {
      label: 'Eras',
      headline: `The ${era}: ${event.level_name}`,
      body: `${films(event.count)} from the ${era}. ${toNext(event)}`,
    }
  }
  return {
    label: 'Expertise',
    headline: `${event.subject}: ${event.level_name}`,
    body: `${films(event.count)} of ${event.subject}. ${toNext(event)}`,
  }
}

function counted(n: number, what: string): string | null {
  return n ? `${n} ${what}${n === 1 ? '' : 's'}` : null
}

function summaryCopy(event: JourneySummaryEvent): Copy {
  const parts = [
    counted(event.stamps.length, 'passport stamp'),
    counted(event.genre_levels.length, 'genre level'),
    counted(event.decade_levels.length, 'era level'),
  ].filter((part): part is string => part !== null)
  const last = parts[parts.length - 1]
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${last}` : last
  return {
    label: 'Your journey',
    headline: "Look how far you've come",
    body: `Your library earned ${list}. Find them all on the Journey tab.`,
  }
}

export function rewardCopy(event: RewardEvent): Copy {
  switch (event.kind) {
    case 'journey_summary':
      return summaryCopy(event)
    case 'genre_level':
    case 'decade_level':
    case 'country_stamp':
      return journeyCopy(event)
    default:
      return setCopy(event)
  }
}
