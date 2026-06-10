/* eslint-disable react-refresh/only-export-components -- store module intentionally exports the provider alongside its hook and helpers */
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_WEIGHTS } from './data/positions'
import { SAMPLE_PLAYERS } from './data/samplePlayers'
import type {
  AppState,
  GamePlan,
  PeriodLineup,
  Player,
  PositionId,
  Ratings,
} from './types'

const STORAGE_KEY = 'u12-coach-v1'
const DEFAULT_PERIODS = 4

function emptyGame(periodCount = DEFAULT_PERIODS): GamePlan {
  return {
    opponent: '',
    date: '',
    periodCount,
    periods: Array.from({ length: periodCount }, () => ({})),
  }
}

export function initialState(): AppState {
  return {
    players: SAMPLE_PLAYERS,
    weights: structuredClone(DEFAULT_WEIGHTS),
    game: emptyGame(),
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (Array.isArray(parsed.players) && parsed.weights && parsed.game) {
        return parsed
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
    case 'importState':
      return action.state
    case 'loadDemo':
      return initialState()
    case 'clearAll':
      return { players: [], weights: structuredClone(DEFAULT_WEIGHTS), game: emptyGame() }
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
