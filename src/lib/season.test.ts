import { describe, expect, it } from 'vitest'
import { emptyRatings } from '../data/attributes'
import { emptyGameStats } from '../data/stats'
import type { GameRecord, GameStats, Player, PlayerReview } from '../types'
import { buildSuggestions, lowStarFlags, seasonLines } from './season'

function makePlayer(id: string, ratings: Partial<Player['ratings']> = {}): Player {
  return {
    id,
    name: id,
    jersey: '',
    available: true,
    notes: '',
    ratings: { ...emptyRatings(3), ...ratings },
  }
}

let gameSeq = 0
function makeGame(opts: {
  /** playerId -> periods played this game */
  periods?: Record<string, number>
  stats?: Record<string, Partial<GameStats>>
  reviews?: Record<string, PlayerReview>
}): GameRecord {
  // Spread each player's periods across period lineups; position ids are
  // irrelevant to the season engine, only occupancy counts.
  const periodLineups: GameRecord['periods'] = [{}, {}, {}, {}]
  const positions = ['GK', 'LB', 'CB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'ST'] as const
  let posIdx = 0
  for (const [playerId, count] of Object.entries(opts.periods ?? {})) {
    const pos = positions[posIdx++ % positions.length]
    for (let i = 0; i < count; i++) periodLineups[i][pos] = playerId
  }
  const stats: GameRecord['stats'] = {}
  for (const [playerId, s] of Object.entries(opts.stats ?? {})) {
    stats[playerId] = { ...emptyGameStats(), ...s }
  }
  return {
    id: `test-${gameSeq++}`,
    opponent: 'Test FC',
    date: '2026-06-01',
    periodCount: 4,
    periods: periodLineups,
    stats,
    reviews: opts.reviews ?? {},
    scoreUs: 0,
    scoreThem: 0,
  }
}

describe('seasonLines', () => {
  it('accumulates games, periods, stats, stars, and tags', () => {
    const history = [
      makeGame({
        periods: { a: 3, b: 2 },
        stats: { a: { stops: 4 } },
        reviews: { a: { stars: 4, tags: ['tag-hustle'] } },
      }),
      makeGame({
        periods: { a: 2 },
        stats: { a: { stops: 2, goals: 1 } },
        reviews: { a: { stars: 3, tags: ['tag-hustle', 'tag-passing'] } },
      }),
    ]
    const lines = seasonLines(history)
    const a = lines.get('a')!
    expect(a.games).toBe(2)
    expect(a.periods).toBe(5)
    expect(a.totals.stops).toBe(6)
    expect(a.totals.goals).toBe(1)
    expect(a.starSum).toBe(7)
    expect(a.starGames).toBe(2)
    expect(a.tagGames['tag-hustle']).toBe(2)
    expect(lines.get('b')!.games).toBe(1)
  })

  it('counts a game when a player has stats but no recorded periods', () => {
    const history = [makeGame({ stats: { sub: { goals: 1 } } })]
    expect(seasonLines(history).get('sub')!.games).toBe(1)
  })
})

describe('buildSuggestions', () => {
  // "filler" players give the team a baseline rate so one player can stand out.
  const roster = [
    makePlayer('star', { tackling: 3 }),
    makePlayer('filler1'),
    makePlayer('filler2'),
  ]

  function standoutHistory(games: number) {
    return Array.from({ length: games }, () =>
      makeGame({
        periods: { star: 3, filler1: 3, filler2: 3 },
        stats: { star: { stops: 3 }, filler1: { stops: 1 } },
      }),
    )
  }

  it('suggests +1 for a team-leading stat rate after enough games', () => {
    const suggestions = buildSuggestions(roster, standoutHistory(3), [])
    const s = suggestions.find((x) => x.playerId === 'star' && x.attribute === 'tackling')
    expect(s).toBeDefined()
    expect(s!.from).toBe(3)
    expect(s!.to).toBe(4)
    expect(s!.reason).toContain('stops')
  })

  it('stays quiet before the minimum game count', () => {
    expect(buildSuggestions(roster, standoutHistory(2), [])).toHaveLength(0)
  })

  it('never suggests past the maximum rating', () => {
    const maxed = [makePlayer('star', { tackling: 5 }), makePlayer('filler1'), makePlayer('filler2')]
    const suggestions = buildSuggestions(maxed, standoutHistory(5), [])
    expect(suggestions.filter((s) => s.playerId === 'star' && s.attribute === 'tackling')).toHaveLength(0)
  })

  it('requires stronger, longer evidence to reach a 5 than a 4', () => {
    const nearMax = [makePlayer('star', { tackling: 4 }), makePlayer('filler1'), makePlayer('filler2')]
    // A dominant 3-game streak is enough for ->4 but must not be enough for ->5.
    expect(buildSuggestions(nearMax, standoutHistory(3), [])).toHaveLength(0)
    const s = buildSuggestions(nearMax, standoutHistory(5), []).find(
      (x) => x.playerId === 'star' && x.attribute === 'tackling',
    )
    expect(s).toBeDefined()
    expect(s!.to).toBe(5)
  })

  it('suggests from repeated review tags', () => {
    const history = Array.from({ length: 3 }, () =>
      makeGame({
        periods: { star: 3, filler1: 3 },
        reviews: { star: { stars: 0, tags: ['tag-hustle'] } },
      }),
    )
    const s = buildSuggestions(roster, history, []).find(
      (x) => x.playerId === 'star' && x.attribute === 'workRate',
    )
    expect(s).toBeDefined()
    expect(s!.reason).toContain('Great hustle')
  })

  it('emits at most one suggestion per attribute per player', () => {
    // Goals and shots both map to shooting.
    const history = Array.from({ length: 3 }, () =>
      makeGame({
        periods: { star: 3, filler1: 3, filler2: 3 },
        stats: { star: { goals: 2, shots: 3 } },
      }),
    )
    const forShooting = buildSuggestions(roster, history, []).filter(
      (s) => s.playerId === 'star' && s.attribute === 'shooting',
    )
    expect(forShooting).toHaveLength(1)
  })

  it('honors dismissed keys', () => {
    const all = buildSuggestions(roster, standoutHistory(3), [])
    const key = all.find((s) => s.playerId === 'star')!.key
    const after = buildSuggestions(roster, standoutHistory(3), [key])
    expect(after.find((s) => s.key === key)).toBeUndefined()
  })
})

describe('lowStarFlags', () => {
  it('flags players consistently rated low, after enough rated games', () => {
    const lowGames = Array.from({ length: 3 }, () =>
      makeGame({ periods: { a: 3 }, reviews: { a: { stars: 2, tags: [] } } }),
    )
    expect(lowStarFlags(lowGames)[0]?.playerId).toBe('a')
    expect(lowStarFlags(lowGames.slice(0, 2))).toHaveLength(0)
    const fineGames = Array.from({ length: 3 }, () =>
      makeGame({ periods: { a: 3 }, reviews: { a: { stars: 4, tags: [] } } }),
    )
    expect(lowStarFlags(fineGames)).toHaveLength(0)
  })
})
