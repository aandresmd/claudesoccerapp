import { POSITION_IDS } from '../data/positions'
import type { PeriodLineup, Player, PositionId, WeightProfiles } from '../types'
import { bestAssignment } from './assignment'
import { fitScore } from './scoring'

/**
 * Best starting lineup: assigns players to the nine 3-4-1 positions so the
 * total fit score across the team is the maximum possible.
 *
 * `lockedAssignments` pins players to positions before optimizing the rest.
 * `playedCounts` (periods already played per player id) lets game-day
 * auto-fill trade a little fit for balanced playing time.
 */
export function suggestLineup(
  players: Player[],
  weights: WeightProfiles,
  options: {
    lockedAssignments?: PeriodLineup
    playedCounts?: Record<string, number>
    fairnessWeight?: number
  } = {},
): PeriodLineup {
  const { lockedAssignments = {}, playedCounts = {}, fairnessWeight = 0 } = options

  const lineup: PeriodLineup = {}
  const lockedPlayerIds = new Set<string>()
  for (const pos of POSITION_IDS) {
    const id = lockedAssignments[pos]
    if (id && players.some((p) => p.id === id && p.available)) {
      lineup[pos] = id
      lockedPlayerIds.add(id)
    }
  }

  const openPositions = POSITION_IDS.filter((pos) => !lineup[pos])
  const pool = players.filter((p) => p.available && !lockedPlayerIds.has(p.id))
  if (openPositions.length === 0 || pool.length === 0) return lineup

  const scores = openPositions.map((pos) =>
    pool.map(
      (player) =>
        fitScore(player.ratings, weights[pos]) -
        fairnessWeight * (playedCounts[player.id] ?? 0),
    ),
  )

  const match = bestAssignment(scores)
  match.forEach((playerIdx, posIdx) => {
    if (playerIdx >= 0) lineup[openPositions[posIdx]] = pool[playerIdx].id
  })
  return lineup
}

/** Per-position runners-up, for "who else could play here" coaching decisions. */
export function alternativesForPosition(
  players: Player[],
  weights: WeightProfiles,
  position: PositionId,
  excludeId: string | undefined,
  count = 3,
): { player: Player; score: number }[] {
  return players
    .filter((p) => p.available && p.id !== excludeId)
    .map((player) => ({ player, score: fitScore(player.ratings, weights[position]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

export function countPeriodsPlayed(periods: PeriodLineup[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const period of periods) {
    for (const pos of POSITION_IDS) {
      const id = period[pos]
      if (id) counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return counts
}

/**
 * Plan a whole game: fills every period, keeping any manually placed players,
 * spreading minutes evenly while favoring each player's best positions.
 */
export function autoPlanGame(
  players: Player[],
  weights: WeightProfiles,
  periods: PeriodLineup[],
  fairnessWeight = 25,
): PeriodLineup[] {
  const planned: PeriodLineup[] = []
  for (let i = 0; i < periods.length; i++) {
    const counts = countPeriodsPlayed([...planned, ...periods.slice(i + 1)])
    planned.push(
      suggestLineup(players, weights, {
        lockedAssignments: periods[i],
        playedCounts: counts,
        fairnessWeight,
      }),
    )
  }
  return planned
}
