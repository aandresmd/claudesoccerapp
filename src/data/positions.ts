import type { PositionDef, PositionId, Ratings, WeightProfiles } from '../types'

/**
 * 3-4-1 formation for 9v9 (standard U12 format):
 * a back three, a midfield four with two wide players, and a lone striker.
 */
export const POSITIONS: PositionDef[] = [
  {
    id: 'GK',
    name: 'Goalkeeper',
    group: 'Goalkeeper',
    x: 50,
    y: 91,
    description: 'Last line of defense. Needs safe hands, courage, and a loud voice to organize the back line.',
  },
  {
    id: 'LB',
    name: 'Left Back',
    group: 'Defense',
    x: 22,
    y: 73,
    description: 'Defends the left channel 1v1 and covers behind the left mid. Speed and tenacity matter most.',
  },
  {
    id: 'CB',
    name: 'Center Back',
    group: 'Defense',
    x: 50,
    y: 77,
    description: 'Anchor of the back three. Wins duels, reads danger early, and directs the defense.',
  },
  {
    id: 'RB',
    name: 'Right Back',
    group: 'Defense',
    x: 78,
    y: 73,
    description: 'Defends the right channel 1v1 and covers behind the right mid. Speed and tenacity matter most.',
  },
  {
    id: 'LM',
    name: 'Left Mid',
    group: 'Midfield',
    x: 12,
    y: 45,
    description: 'Provides width on the left, takes defenders on, and tracks back to help the left back.',
  },
  {
    id: 'LCM',
    name: 'Left Center Mid',
    group: 'Midfield',
    x: 37,
    y: 50,
    description: 'Engine of the team. Links defense to attack with passing, vision, and constant running.',
  },
  {
    id: 'RCM',
    name: 'Right Center Mid',
    group: 'Midfield',
    x: 63,
    y: 50,
    description: 'Engine of the team. Links defense to attack with passing, vision, and constant running.',
  },
  {
    id: 'RM',
    name: 'Right Mid',
    group: 'Midfield',
    x: 88,
    y: 45,
    description: 'Provides width on the right, takes defenders on, and tracks back to help the right back.',
  },
  {
    id: 'ST',
    name: 'Striker',
    group: 'Attack',
    x: 50,
    y: 18,
    description: 'Lone forward. Finishes chances, holds the ball up, and leads the press from the front.',
  },
]

export const POSITION_IDS = POSITIONS.map((p) => p.id)

export function positionById(id: PositionId): PositionDef {
  return POSITIONS.find((p) => p.id === id)!
}

function w(partial: Partial<Ratings>): Ratings {
  return {
    speed: 0,
    endurance: 0,
    ballControl: 0,
    dribbling: 0,
    passing: 0,
    shooting: 0,
    tackling: 0,
    positioning: 0,
    strength: 0,
    workRate: 0,
    communication: 0,
    handling: 0,
    ...partial,
  }
}

const OUTSIDE_BACK = w({
  speed: 4,
  endurance: 4,
  tackling: 5,
  positioning: 3,
  workRate: 4,
  passing: 2,
  ballControl: 2,
  strength: 2,
  communication: 1,
})

const CENTER_MID = w({
  passing: 5,
  endurance: 5,
  positioning: 4,
  ballControl: 4,
  workRate: 4,
  dribbling: 3,
  tackling: 3,
  communication: 3,
  speed: 2,
  shooting: 2,
  strength: 2,
})

const WIDE_MID = w({
  speed: 5,
  dribbling: 4,
  endurance: 4,
  ballControl: 3,
  passing: 3,
  workRate: 3,
  shooting: 2,
  tackling: 2,
  positioning: 2,
})

/** Default importance of each attribute per position (0–5). Fully editable in the app. */
export const DEFAULT_WEIGHTS: WeightProfiles = {
  GK: w({
    handling: 5,
    positioning: 4,
    communication: 4,
    strength: 2,
    ballControl: 2,
    passing: 2,
    workRate: 1,
    speed: 1,
  }),
  LB: OUTSIDE_BACK,
  RB: OUTSIDE_BACK,
  CB: w({
    tackling: 5,
    positioning: 5,
    strength: 4,
    communication: 4,
    passing: 3,
    speed: 3,
    workRate: 3,
    ballControl: 2,
    endurance: 2,
  }),
  LM: WIDE_MID,
  RM: WIDE_MID,
  LCM: CENTER_MID,
  RCM: CENTER_MID,
  ST: w({
    shooting: 5,
    speed: 4,
    ballControl: 4,
    positioning: 4,
    dribbling: 3,
    strength: 3,
    workRate: 3,
    passing: 2,
  }),
}
