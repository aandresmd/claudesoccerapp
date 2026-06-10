import { describe, expect, it } from 'vitest'
import { emptyRatings } from '../data/attributes'
import { DEFAULT_WEIGHTS, POSITION_IDS } from '../data/positions'
import { SAMPLE_PLAYERS } from '../data/samplePlayers'
import type { Player, Ratings } from '../types'
import { bestAssignment } from './assignment'
import { fitScore, positionFits } from './scoring'
import { autoPlanGame, countPeriodsPlayed, suggestLineup } from './suggest'

function makePlayer(id: string, ratings: Partial<Ratings>): Player {
  return {
    id,
    name: id,
    jersey: '',
    available: true,
    notes: '',
    ratings: { ...emptyRatings(1), ...ratings },
  }
}

describe('fitScore', () => {
  it('is 100 for a perfect player and scales linearly', () => {
    const perfect = emptyRatings(5)
    expect(fitScore(perfect, DEFAULT_WEIGHTS.ST)).toBe(100)
    const average = emptyRatings(3)
    expect(fitScore(average, DEFAULT_WEIGHTS.ST)).toBe(60)
  })

  it('ignores attributes with zero weight', () => {
    const ratings = emptyRatings(5)
    ratings.handling = 1 // striker profile gives handling weight 0
    expect(fitScore(ratings, DEFAULT_WEIGHTS.ST)).toBe(100)
  })

  it('ranks a keeper profile highest in goal', () => {
    const keeper = makePlayer('gk', { handling: 5, positioning: 4, communication: 4 })
    expect(positionFits(keeper, DEFAULT_WEIGHTS)[0].position).toBe('GK')
  })
})

describe('bestAssignment', () => {
  it('finds the optimal matching, not the greedy one', () => {
    // Greedy would give row0 -> col0 (9), forcing row1 -> col1 (1): total 10.
    // Optimal is row0 -> col1 (8), row1 -> col0 (8): total 16.
    const scores = [
      [9, 8],
      [8, 1],
    ]
    expect(bestAssignment(scores)).toEqual([1, 0])
  })

  it('handles more rows than columns by leaving rows unmatched', () => {
    const scores = [
      [1, 2],
      [9, 1],
      [5, 6],
    ]
    const result = bestAssignment(scores)
    expect(result.filter((c) => c >= 0)).toHaveLength(2)
    const total = result.reduce((sum, c, r) => sum + (c >= 0 ? scores[r][c] : 0), 0)
    expect(total).toBe(9 + 6)
  })
})

describe('suggestLineup', () => {
  it('fills all nine positions with distinct available players', () => {
    const lineup = suggestLineup(SAMPLE_PLAYERS, DEFAULT_WEIGHTS)
    const ids = POSITION_IDS.map((pos) => lineup[pos])
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(9)
  })

  it('puts the strongest keeper in goal for the sample roster', () => {
    const lineup = suggestLineup(SAMPLE_PLAYERS, DEFAULT_WEIGHTS)
    expect(lineup.GK).toBe('sample-1') // Avery, GK Hands 5
  })

  it('never selects unavailable players', () => {
    const players = SAMPLE_PLAYERS.map((p) => ({ ...p, available: p.id !== 'sample-1' }))
    const lineup = suggestLineup(players, DEFAULT_WEIGHTS)
    expect(Object.values(lineup)).not.toContain('sample-1')
  })

  it('respects locked assignments', () => {
    const lineup = suggestLineup(SAMPLE_PLAYERS, DEFAULT_WEIGHTS, {
      lockedAssignments: { ST: 'sample-2' },
    })
    expect(lineup.ST).toBe('sample-2')
    expect(Object.values(lineup).filter((id) => id === 'sample-2')).toHaveLength(1)
  })

  it('leaves positions empty when fewer than nine players are available', () => {
    const players = SAMPLE_PLAYERS.slice(0, 7)
    const lineup = suggestLineup(players, DEFAULT_WEIGHTS)
    const filled = POSITION_IDS.filter((pos) => lineup[pos])
    expect(filled).toHaveLength(7)
    expect(new Set(filled.map((pos) => lineup[pos])).size).toBe(7)
  })
})

describe('autoPlanGame', () => {
  it('spreads playing time across a 14-player roster over 4 periods', () => {
    const periods = autoPlanGame(SAMPLE_PLAYERS, DEFAULT_WEIGHTS, [{}, {}, {}, {}])
    const counts = countPeriodsPlayed(periods)
    // 36 slots / 14 players: everyone should play 2 or 3 periods.
    for (const p of SAMPLE_PLAYERS) {
      expect(counts[p.id], `${p.name} periods`).toBeGreaterThanOrEqual(2)
      expect(counts[p.id], `${p.name} periods`).toBeLessThanOrEqual(3)
    }
  })

  it('keeps manually placed players where the coach put them', () => {
    const periods = autoPlanGame(SAMPLE_PLAYERS, DEFAULT_WEIGHTS, [
      { GK: 'sample-13' },
      {},
      {},
      {},
    ])
    expect(periods[0].GK).toBe('sample-13')
  })
})
