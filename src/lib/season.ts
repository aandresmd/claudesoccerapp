import { ATTRIBUTES, RATING_MAX } from '../data/attributes'
import { REVIEW_TAGS, STAT_DEFS, emptyGameStats } from '../data/stats'
import type { AttributeId, GameRecord, GameStats, Player } from '../types'
import { countPeriodsPlayed } from './suggest'

/** A player's accumulated season evidence across all archived games. */
export interface SeasonLine {
  playerId: string
  /** Games she appeared in (played a period or recorded a stat). */
  games: number
  periods: number
  totals: GameStats
  starSum: number
  /** Games where the coach gave a star rating. */
  starGames: number
  /** Games in which each review tag was awarded. */
  tagGames: Record<string, number>
}

export function seasonLines(history: GameRecord[]): Map<string, SeasonLine> {
  const lines = new Map<string, SeasonLine>()
  const line = (playerId: string): SeasonLine => {
    let l = lines.get(playerId)
    if (!l) {
      l = {
        playerId,
        games: 0,
        periods: 0,
        totals: emptyGameStats(),
        starSum: 0,
        starGames: 0,
        tagGames: {},
      }
      lines.set(playerId, l)
    }
    return l
  }

  for (const game of history) {
    const periodCounts = countPeriodsPlayed(game.periods)
    const appeared = new Set<string>(Object.keys(periodCounts))
    for (const [playerId, stats] of Object.entries(game.stats)) {
      if (STAT_DEFS.some((s) => stats[s.id] > 0)) appeared.add(playerId)
    }

    for (const playerId of appeared) {
      const l = line(playerId)
      l.games += 1
      l.periods += periodCounts[playerId] ?? 0
      const stats = game.stats[playerId]
      if (stats) {
        for (const s of STAT_DEFS) l.totals[s.id] += stats[s.id] ?? 0
      }
      const review = game.reviews[playerId]
      if (review) {
        if (review.stars > 0) {
          l.starSum += review.stars
          l.starGames += 1
        }
        for (const tag of review.tags) {
          l.tagGames[tag] = (l.tagGames[tag] ?? 0) + 1
        }
      }
    }
  }
  return lines
}

export interface Suggestion {
  /** Stable identity so applying/dismissing it makes it stay gone. */
  key: string
  playerId: string
  attribute: AttributeId
  from: number
  to: number
  reason: string
  /** How far above the bar the evidence is; used to pick the best reason per attribute. */
  strength: number
}

/** Games of evidence required before the app starts suggesting anything. */
export const MIN_GAMES = 3
const MIN_PERIODS = 4

export function attributeLabel(id: AttributeId): string {
  return ATTRIBUTES.find((a) => a.id === id)?.label ?? id
}

/**
 * Suggest +1 rating nudges backed by season evidence. Suggestions only ever
 * nudge upward — absence of events is weak evidence at U12 (defenders don't
 * shoot), so downward adjustments stay a coach judgment call (see lowStarFlags).
 *
 * Raising a rating to 5 requires roughly twice the evidence of other nudges,
 * so an applied suggestion doesn't immediately re-suggest the next level.
 */
export function buildSuggestions(
  players: Player[],
  history: GameRecord[],
  dismissed: string[],
): Suggestion[] {
  const lines = seasonLines(history)
  const dismissedSet = new Set(dismissed)

  // Team-wide event rates as the baseline for "stands out".
  const teamTotals = emptyGameStats()
  let teamPeriods = 0
  for (const l of lines.values()) {
    teamPeriods += l.periods
    for (const s of STAT_DEFS) teamTotals[s.id] += l.totals[s.id]
  }

  const suggestions: Suggestion[] = []

  for (const player of players) {
    const l = lines.get(player.id)
    if (!l || l.games < MIN_GAMES || l.periods < MIN_PERIODS) continue

    // Best candidate per attribute so goals and shots don't both nag about Finishing.
    const byAttribute = new Map<AttributeId, Suggestion>()
    const consider = (s: Suggestion) => {
      const existing = byAttribute.get(s.attribute)
      if (!existing || s.strength > existing.strength) byAttribute.set(s.attribute, s)
    }

    for (const def of STAT_DEFS) {
      const events = l.totals[def.id]
      const from = player.ratings[def.attribute]
      if (from >= RATING_MAX || events === 0) continue
      const to = from + 1
      const minEvents = to === RATING_MAX ? 6 : 4
      const multiple = to === RATING_MAX ? 2 : 1.5
      const minGames = to === RATING_MAX ? 5 : MIN_GAMES
      const rate = events / l.periods
      const teamRate = teamPeriods > 0 ? teamTotals[def.id] / teamPeriods : 0
      if (l.games < minGames || events < minEvents || rate < multiple * teamRate) continue
      const ratio = teamRate > 0 ? rate / teamRate : Infinity
      const ratioText = Number.isFinite(ratio)
        ? `about ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× the team rate`
        : 'leading the team'
      consider({
        key: `${player.id}:${def.attribute}:${to}`,
        playerId: player.id,
        attribute: def.attribute,
        from,
        to,
        reason: `${events} ${def.label.toLowerCase()} in ${l.periods} periods over ${l.games} games — ${ratioText}`,
        strength: Number.isFinite(ratio) ? ratio : 99,
      })
    }

    for (const tag of REVIEW_TAGS) {
      const taggedGames = l.tagGames[tag.id] ?? 0
      const from = player.ratings[tag.attribute]
      if (from >= RATING_MAX || taggedGames === 0) continue
      const to = from + 1
      const needed = to === RATING_MAX ? 5 : 3
      if (taggedGames < needed) continue
      consider({
        key: `${player.id}:${tag.attribute}:${to}`,
        playerId: player.id,
        attribute: tag.attribute,
        from,
        to,
        reason: `Tagged “${tag.label}” in ${taggedGames} of ${l.games} games`,
        strength: taggedGames / l.games,
      })
    }

    for (const s of byAttribute.values()) {
      if (!dismissedSet.has(s.key)) suggestions.push(s)
    }
  }

  return suggestions.sort((a, b) => b.strength - a.strength)
}

export interface LowStarFlag {
  playerId: string
  avgStars: number
  starGames: number
}

/**
 * Players consistently rated low in post-game reviews. Surfaced as a gentle
 * "worth revisiting her ratings" note, never an automatic downgrade.
 */
export function lowStarFlags(history: GameRecord[]): LowStarFlag[] {
  const flags: LowStarFlag[] = []
  for (const l of seasonLines(history).values()) {
    if (l.starGames < MIN_GAMES) continue
    const avg = l.starSum / l.starGames
    if (avg <= 2.4) {
      flags.push({ playerId: l.playerId, avgStars: avg, starGames: l.starGames })
    }
  }
  return flags.sort((a, b) => a.avgStars - b.avgStars)
}

/** "Isla 2, Jordyn 1" — goal scorers for a game log line. */
export function scorerSummary(game: GameRecord, players: Player[]): string {
  const names = new Map(players.map((p) => [p.id, p.name]))
  const scorers = Object.entries(game.stats)
    .map(([id, stats]) => ({ name: names.get(id) ?? 'Former player', goals: stats.goals }))
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)
  return scorers.map((s) => (s.goals > 1 ? `${s.name} ${s.goals}` : s.name)).join(', ')
}
