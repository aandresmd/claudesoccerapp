export type AttributeId =
  | 'speed'
  | 'endurance'
  | 'ballControl'
  | 'dribbling'
  | 'passing'
  | 'shooting'
  | 'tackling'
  | 'positioning'
  | 'strength'
  | 'workRate'
  | 'communication'
  | 'handling'

export interface AttributeDef {
  id: AttributeId
  label: string
  short: string
  hint: string
}

/** Coach rates every attribute 1 (developing) to 5 (excellent). */
export type Ratings = Record<AttributeId, number>

export interface Player {
  id: string
  name: string
  jersey: string
  available: boolean
  notes: string
  ratings: Ratings
}

export type PositionId =
  | 'GK'
  | 'LB'
  | 'CB'
  | 'RB'
  | 'LM'
  | 'LCM'
  | 'RCM'
  | 'RM'
  | 'ST'

export type PositionGroup = 'Goalkeeper' | 'Defense' | 'Midfield' | 'Attack'

export interface PositionDef {
  id: PositionId
  name: string
  group: PositionGroup
  /** Pitch placement, percent of pitch width/height (attacking toward the top). */
  x: number
  y: number
  description: string
}

/** Importance of each attribute for a position, 0 (irrelevant) to 5 (critical). */
export type WeightProfiles = Record<PositionId, Ratings>

/** Player id (or undefined) for each position in one period of play. */
export type PeriodLineup = Partial<Record<PositionId, string>>

export interface GamePlan {
  opponent: string
  date: string
  periodCount: number
  periods: PeriodLineup[]
}

export interface AppState {
  players: Player[]
  weights: WeightProfiles
  game: GamePlan
}
