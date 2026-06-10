import { ATTRIBUTES, RATING_MAX } from '../data/attributes'
import { POSITIONS } from '../data/positions'
import type { Player, PositionId, Ratings, WeightProfiles } from '../types'

/**
 * How well a player's attributes match a position's trait weights,
 * as a percentage of a perfect (all 5s on every weighted trait) player.
 */
export function fitScore(ratings: Ratings, weights: Ratings): number {
  let num = 0
  let den = 0
  for (const a of ATTRIBUTES) {
    num += weights[a.id] * ratings[a.id]
    den += weights[a.id] * RATING_MAX
  }
  if (den === 0) return 0
  return Math.round((num / den) * 1000) / 10
}

export interface PositionFit {
  position: PositionId
  score: number
}

/** Every position's fit for a player, best first. */
export function positionFits(player: Player, weights: WeightProfiles): PositionFit[] {
  return POSITIONS.map((p) => ({
    position: p.id,
    score: fitScore(player.ratings, weights[p.id]),
  })).sort((a, b) => b.score - a.score)
}

/** Overall rating = how good the player is in her best role. */
export function overallRating(player: Player, weights: WeightProfiles): number {
  return positionFits(player, weights)[0]?.score ?? 0
}

/** Players ranked for one position, best first. */
export function rankPlayersForPosition(
  players: Player[],
  weights: WeightProfiles,
  position: PositionId,
): { player: Player; score: number }[] {
  return players
    .map((player) => ({ player, score: fitScore(player.ratings, weights[position]) }))
    .sort((a, b) => b.score - a.score)
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--score-great)'
  if (score >= 65) return 'var(--score-good)'
  if (score >= 50) return 'var(--score-ok)'
  return 'var(--score-low)'
}
