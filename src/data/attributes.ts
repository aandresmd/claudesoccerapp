import type { AttributeDef, Ratings } from '../types'

export const ATTRIBUTES: AttributeDef[] = [
  {
    id: 'speed',
    label: 'Speed',
    short: 'SPD',
    hint: 'Straight-line pace and quickness over short distances',
  },
  {
    id: 'endurance',
    label: 'Endurance',
    short: 'END',
    hint: 'Can keep running hard for a whole half without fading',
  },
  {
    id: 'ballControl',
    label: 'First Touch',
    short: 'TCH',
    hint: 'Controls passes and bouncing balls cleanly under pressure',
  },
  {
    id: 'dribbling',
    label: 'Dribbling',
    short: 'DRI',
    hint: 'Beats defenders 1v1 and keeps the ball at speed',
  },
  {
    id: 'passing',
    label: 'Passing',
    short: 'PAS',
    hint: 'Accuracy and decision-making on short and long passes',
  },
  {
    id: 'shooting',
    label: 'Finishing',
    short: 'FIN',
    hint: 'Shot power, accuracy, and composure in front of goal',
  },
  {
    id: 'tackling',
    label: 'Defending',
    short: 'DEF',
    hint: 'Wins tackles, blocks, and 50/50 balls; defends 1v1',
  },
  {
    id: 'positioning',
    label: 'Game Sense',
    short: 'IQ',
    hint: 'Reads the game, finds space, knows where to be',
  },
  {
    id: 'strength',
    label: 'Strength',
    short: 'STR',
    hint: 'Holds her ground, shields the ball, wins physical duels',
  },
  {
    id: 'workRate',
    label: 'Work Rate',
    short: 'WRK',
    hint: 'Hustle, pressing, and effort tracking back',
  },
  {
    id: 'communication',
    label: 'Leadership',
    short: 'LDR',
    hint: 'Talks on the field, organizes and encourages teammates',
  },
  {
    id: 'handling',
    label: 'GK Hands',
    short: 'GKH',
    hint: 'Catching, diving, and comfort playing in goal',
  },
]

export const RATING_MIN = 1
export const RATING_MAX = 5

export const RATING_LABELS: Record<number, string> = {
  1: 'Developing',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
}

export function emptyRatings(value = 3): Ratings {
  const r = {} as Ratings
  for (const a of ATTRIBUTES) r[a.id] = value
  return r
}
