import type {
  EggEvent,
  MissionEvent,
  FilmMilestoneEvent,
  JourneyRewardEvent,
  JourneySummaryEvent,
  LogMilestoneEvent,
  RewardCard,
  WatchTimeEvent,
  SetRewardEvent,
  SetsSummaryEvent,
} from '@/api/types'
import { countryName, decadeLabel, films, LEVEL_NAMES } from '@/lib/journey'

// Card wording (design.md §6.4: quirky, a little nerdy). Sets with a theme_key get their own.
const THEMED: Record<string, Partial<Record<SetRewardEvent['kind'], string>>> = {
  'star-wars': {
    set_progressed: 'Stay on target.',
    set_completed: 'The Force is strong with this one.',
    set_polished: 'Balance restored to the Force.',
  },
  oscars: {
    set_progressed: 'The envelope, please.',
    set_completed: 'And the Oscar goes to… you.',
    set_polished: 'Back on the red carpet.',
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

// A line of character for some niches (design.md §6.4); the rest go without.
const NICHE_FLOURISH: Record<string, string> = {
  Heist: 'Nobody move.',
  Spy: 'Shaken, not stirred.',
  Zombie: 'Braaains.',
  Christmas: 'Ho ho ho.',
  Musical: 'Take it from the top.',
  Slasher: "Don't go in there.",
  'Film Noir': 'The night was dark.',
  'Silent Film': '…',
}

function journeyCopy(event: JourneyRewardEvent): Copy {
  if (event.kind === 'country_stamp') {
    return {
      label: 'Passport',
      headline: 'New stamp!',
      body: `Your first film from ${countryName(event.subject)}. Bon voyage.`,
    }
  }
  if (event.kind === 'keyword_level') {
    const flourish = NICHE_FLOURISH[event.subject]
    return {
      label: 'Niches',
      headline: `${event.subject}: ${event.level_name}`,
      body: [`${films(event.count)} of ${event.subject}.`, flourish, toNext(event)]
        .filter(Boolean)
        .join(' '),
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

// Milestones with a name of their own; the rest are "N tickets".
const MILESTONE_HEADLINES: Record<number, string> = {
  1: 'Your first ticket!',
  5: 'High five',
  10: 'Double figures',
  50: 'Half a century',
  100: 'Triple figures',
  1000: 'The thousand club',
}

function tickets(n: number): string {
  return `${n} ticket${n === 1 ? '' : 's'}`
}

function milestoneCopy(event: LogMilestoneEvent): Copy {
  const { milestone, count, next_at: nextAt } = event
  const next = nextAt === null ? 'That was the last milestone. Legendary.' : `Next stop: ${nextAt}.`
  const body =
    milestone === 1
      ? `Welcome to the club. Your diary has begun. ${next}`
      : `${tickets(count)} logged since you joined. ${next}`
  return {
    label: 'Tickets',
    headline: MILESTONE_HEADLINES[milestone] ?? tickets(milestone),
    body,
  }
}

// Library sizes with a name of their own; the rest are "250 films".
function eggCopy(event: EggEvent): Copy {
  return {
    label: 'Easter egg',
    headline: event.title,
    body: event.lore ?? `You found it with ${event.film_title}.`,
  }
}

function missionCopy(event: MissionEvent): Copy {
  return {
    label: 'Mission complete',
    headline: event.title,
    body: event.finish_copy ?? `Done: ${films(event.count)}. Nicely watched.`,
  }
}

const FILM_HEADLINES: Record<number, string> = {
  10: 'Ten films in',
  50: 'Fifty films',
  100: 'A hundred films',
  500: 'Five hundred films',
  1000: 'The thousand-film library',
}

function filmMilestoneCopy(event: FilmMilestoneEvent): Copy {
  const { milestone, count, next_at: nextAt } = event
  const next = nextAt === null ? 'That was the last milestone. Legendary.' : `Next stop: ${nextAt}.`
  return {
    label: 'Library',
    headline: FILM_HEADLINES[milestone] ?? films(milestone),
    body: `${films(count)} in your library, each one counted once. ${next}`,
  }
}

// Checkpoints with a name of their own; the rest are "1,000 hours".
const WATCH_TIME_HEADLINES: Record<number, string> = {
  24: 'A full day of film',
  168: 'A week of film',
  336: 'Two weeks of film',
  720: 'A month of film',
  2160: 'Three months of film',
  8760: 'A year of film',
}

const plural = (n: number, what: string) => `${n} ${what}${n === 1 ? '' : 's'}`

/** 1334 -> "1,334". */
export const hoursText = (n: number) => n.toLocaleString('en-GB')

/** 1334 hours -> "55 days and 14 hours". */
function asDays(hours: number): string {
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  return rest ? `${plural(days, 'day')} and ${plural(rest, 'hour')}` : plural(days, 'day')
}

function watchTimeCopy(event: WatchTimeEvent): Copy {
  const { hours, total_hours: total, next_at: nextAt } = event
  const next =
    nextAt === null
      ? 'That was the last checkpoint. Legendary.'
      : `Next stop: ${hoursText(nextAt)} hours.`
  return {
    label: 'Watch time',
    headline: WATCH_TIME_HEADLINES[hours] ?? `${hoursText(hours)} hours`,
    body: `${hoursText(total)} hours of film so far: ${asDays(total)}. ${next}`,
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
    counted(event.keyword_levels.length, 'niche level'),
  ].filter((part): part is string => part !== null)
  const last = parts[parts.length - 1]
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${last}` : last
  return {
    label: 'Your journey',
    headline: "Look how far you've come",
    body: `Your library earned ${list}. Find them all on the Journey tab.`,
  }
}

function setsSummaryCopy(event: SetsSummaryEvent): Copy {
  const n = event.sets.length
  return {
    label: 'Set progress',
    headline: `${n} more sets moved`,
    body: 'Find them all on the Sets tab.',
  }
}

export function rewardCopy(event: RewardCard): Copy {
  switch (event.kind) {
    case 'sets_summary':
      return setsSummaryCopy(event)
    case 'journey_summary':
      return summaryCopy(event)
    case 'log_milestone':
      return milestoneCopy(event)
    case 'watch_time':
      return watchTimeCopy(event)
    case 'film_milestone':
      return filmMilestoneCopy(event)
    case 'easter_egg':
      return eggCopy(event)
    case 'mission':
      return missionCopy(event)
    case 'genre_level':
    case 'decade_level':
    case 'keyword_level':
    case 'country_stamp':
      return journeyCopy(event)
    default:
      return setCopy(event)
  }
}
