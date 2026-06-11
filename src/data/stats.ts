import type { AttributeId, GameStats, StatId } from '../types'

export interface StatDef {
  id: StatId
  label: string
  short: string
  /** The attribute this stat is evidence for. */
  attribute: AttributeId
  hint: string
}

/**
 * The five live-tally stats. Deliberately few and concrete: things a coach
 * notices anyway and can record with one tap while still coaching.
 */
export const STAT_DEFS: StatDef[] = [
  { id: 'goals', label: 'Goals', short: 'G', attribute: 'shooting', hint: 'Goals scored' },
  { id: 'assists', label: 'Assists', short: 'A', attribute: 'passing', hint: 'Pass leading directly to a goal' },
  { id: 'shots', label: 'Shots', short: 'SH', attribute: 'shooting', hint: 'Shots on target' },
  { id: 'stops', label: 'Stops', short: 'ST', attribute: 'tackling', hint: 'Tackle won, block, or clearance that broke up an attack' },
  { id: 'saves', label: 'Saves', short: 'SV', attribute: 'handling', hint: 'Goalkeeper saves' },
]

export function emptyGameStats(): GameStats {
  return { goals: 0, assists: 0, shots: 0, stops: 0, saves: 0 }
}

export interface ReviewTag {
  id: string
  label: string
  attribute: AttributeId
}

/**
 * One-tap post-game tags, one per attribute. These give the soft skills
 * (work rate, game sense, leadership) their evidence, since those don't
 * produce countable events.
 */
export const REVIEW_TAGS: ReviewTag[] = [
  { id: 'tag-speed', label: 'Used her speed', attribute: 'speed' },
  { id: 'tag-endurance', label: 'Ran all game', attribute: 'endurance' },
  { id: 'tag-touch', label: 'Clean first touch', attribute: 'ballControl' },
  { id: 'tag-dribbling', label: 'Beat players 1v1', attribute: 'dribbling' },
  { id: 'tag-passing', label: 'Strong passing', attribute: 'passing' },
  { id: 'tag-shooting', label: 'Dangerous shooting', attribute: 'shooting' },
  { id: 'tag-defending', label: 'Won her tackles', attribute: 'tackling' },
  { id: 'tag-iq', label: 'Smart positioning', attribute: 'positioning' },
  { id: 'tag-strength', label: 'Won physical battles', attribute: 'strength' },
  { id: 'tag-hustle', label: 'Great hustle', attribute: 'workRate' },
  { id: 'tag-leader', label: 'Talked and led', attribute: 'communication' },
  { id: 'tag-gk', label: 'Solid in goal', attribute: 'handling' },
]
