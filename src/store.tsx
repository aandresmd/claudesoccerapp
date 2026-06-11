/* eslint-disable react-refresh/only-export-components -- store module intentionally exports the provider alongside its hook and helpers */
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_WEIGHTS } from './data/positions'
import { SAMPLE_PLAYERS } from './data/samplePlayers'
import { emptyGameStats } from './data/stats'
import type {
  AppState,
  AttributeId,
  GamePlan,
  GameRecord,
  PeriodLineup,
  Player,
  PlayerReview,
  PositionId,
  Ratings,
  StatId,
} from './types'

const STORAGE_KEY = 'u12-coach-v1'
const DEFAULT_PERIODS = 4

function emptyGame(periodCount = DEFAULT_PERIODS): GamePlan {
  return {
    opponent: '',
    date: '',
    periodCount,
    periods: Array.from({ length: periodCount }, () => ({})),
    stats: {},
    scoreUs: 0,
    scoreThem: 0,
  }
}

export function initialState(): AppState {
  return {
    players: SAMPLE_PLAYERS,
    weights: structuredClone(DEFAULT_WEIGHTS),
    game: emptyGame(),
    history: [],
    dismissed: [],
  }
}

/** Fill in fields that didn't exist when older saved data was written. */
export function migrate(parsed: AppState): AppState {
  return {
    ...initialState(),
    ...parsed,
    game: { ...emptyGame(), ...parsed.game },
    history: parsed.history ?? [],
    dismissed: parsed.dismissed ?? [],
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (Array.isArray(parsed.players) && parsed.weights && parsed.game) {
        return migrate(parsed)
      }
    }
  } catch {
    // fall through to a fresh state
  }
  return initialState()
}

export type Action =
  | { type: 'addPlayer'; player: Player }
  | { type: 'updatePlayer'; player: Player }
  | { type: 'deletePlayer'; id: string }
  | { type: 'toggleAvailable'; id: string }
  | { type: 'setWeights'; position: PositionId; weights: Ratings }
  | { type: 'resetWeights'; position: PositionId }
  | { type: 'setGameInfo'; opponent?: string; date?: string }
  | { type: 'setPeriodCount'; count: number }
  | { type: 'setSlot'; period: number; position: PositionId; playerId?: string }
  | { type: 'setPeriods'; periods: PeriodLineup[] }
  | { type: 'clearPeriod'; period: number }
  | { type: 'newGame' }
  | { type: 'incrementStat'; playerId: string; stat: StatId; delta: number }
  | { type: 'setScore'; scoreUs?: number; scoreThem?: number }
  | { type: 'finalizeGame'; reviews: Record<string, PlayerReview> }
  | { type: 'deleteGame'; id: string }
  | { type: 'setRating'; playerId: string; attribute: AttributeId; value: number; suggestionKey?: string }
  | { type: 'dismissSuggestion'; key: string }
  | { type: 'importState'; state: AppState }
  | { type: 'loadDemo' }
  | { type: 'clearAll' }

function removeFromGame(game: GamePlan, playerId: string): GamePlan {
  return {
    ...game,
    periods: game.periods.map((period) => {
      const next: PeriodLineup = { ...period }
      for (const pos of Object.keys(next) as PositionId[]) {
        if (next[pos] === playerId) delete next[pos]
      }
      return next
    }),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addPlayer':
      return { ...state, players: [...state.players, action.player] }
    case 'updatePlayer':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player.id ? action.player : p)),
      }
    case 'deletePlayer':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        game: removeFromGame(state.game, action.id),
      }
    case 'toggleAvailable': {
      const player = state.players.find((p) => p.id === action.id)
      const nowAvailable = player ? !player.available : false
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, available: !p.available } : p,
        ),
        game: nowAvailable ? state.game : removeFromGame(state.game, action.id),
      }
    }
    case 'setWeights':
      return { ...state, weights: { ...state.weights, [action.position]: action.weights } }
    case 'resetWeights':
      return {
        ...state,
        weights: {
          ...state.weights,
          [action.position]: structuredClone(DEFAULT_WEIGHTS[action.position]),
        },
      }
    case 'setGameInfo':
      return {
        ...state,
        game: {
          ...state.game,
          opponent: action.opponent ?? state.game.opponent,
          date: action.date ?? state.game.date,
        },
      }
    case 'setPeriodCount': {
      const periods = Array.from(
        { length: action.count },
        (_, i) => state.game.periods[i] ?? {},
      )
      return { ...state, game: { ...state.game, periodCount: action.count, periods } }
    }
    case 'setSlot': {
      const periods = state.game.periods.map((period, i) => {
        if (i !== action.period) return period
        const next: PeriodLineup = { ...period }
        // A player can only hold one spot per period.
        if (action.playerId) {
          for (const pos of Object.keys(next) as PositionId[]) {
            if (next[pos] === action.playerId) delete next[pos]
          }
          next[action.position] = action.playerId
        } else {
          delete next[action.position]
        }
        return next
      })
      return { ...state, game: { ...state.game, periods } }
    }
    case 'setPeriods':
      return { ...state, game: { ...state.game, periods: action.periods } }
    case 'clearPeriod':
      return {
        ...state,
        game: {
          ...state.game,
          periods: state.game.periods.map((p, i) => (i === action.period ? {} : p)),
        },
      }
    case 'newGame':
      return { ...state, game: emptyGame(state.game.periodCount) }
    case 'incrementStat': {
      const current = state.game.stats[action.playerId] ?? emptyGameStats()
      const next = {
        ...current,
        [action.stat]: Math.max(0, current[action.stat] + action.delta),
      }
      return {
        ...state,
        game: { ...state.game, stats: { ...state.game.stats, [action.playerId]: next } },
      }
    }
    case 'setScore':
      return {
        ...state,
        game: {
          ...state.game,
          scoreUs: Math.max(0, action.scoreUs ?? state.game.scoreUs),
          scoreThem: Math.max(0, action.scoreThem ?? state.game.scoreThem),
        },
      }
    case 'finalizeGame': {
      const record: GameRecord = {
        id: `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        opponent: state.game.opponent.trim() || 'Opponent',
        date: state.game.date || new Date().toISOString().slice(0, 10),
        periodCount: state.game.periodCount,
        periods: state.game.periods,
        stats: state.game.stats,
        reviews: action.reviews,
        scoreUs: state.game.scoreUs,
        scoreThem: state.game.scoreThem,
      }
      return {
        ...state,
        history: [record, ...state.history],
        game: emptyGame(state.game.periodCount),
      }
    }
    case 'deleteGame':
      return { ...state, history: state.history.filter((g) => g.id !== action.id) }
    case 'setRating': {
      const players = state.players.map((p) =>
        p.id === action.playerId
          ? { ...p, ratings: { ...p.ratings, [action.attribute]: action.value } }
          : p,
      )
      const dismissed = action.suggestionKey
        ? [...state.dismissed, action.suggestionKey]
        : state.dismissed
      return { ...state, players, dismissed }
    }
    case 'dismissSuggestion':
      return { ...state, dismissed: [...state.dismissed, action.key] }
    case 'importState':
      return migrate(action.state)
    case 'loadDemo':
      return initialState()
    case 'clearAll':
      return {
        players: [],
        weights: structuredClone(DEFAULT_WEIGHTS),
        game: emptyGame(),
        history: [],
        dismissed: [],
      }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(
  null,
)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage may be unavailable (private browsing); the app still works in-memory
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function newPlayerId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
