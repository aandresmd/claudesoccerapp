import { useState } from 'react'
import type { DragEvent } from 'react'
import { POSITION_IDS, positionById } from '../data/positions'
import { fitScore, scoreColor } from '../lib/scoring'
import { autoPlanGame, countPeriodsPlayed, suggestLineup } from '../lib/suggest'
import { useStore } from '../store'
import type { PositionId } from '../types'
import { GameReview } from './GameReview'
import { LiveStats } from './LiveStats'
import { DND_MIME, Pitch } from './Pitch'

interface Selection {
  playerId: string
  fromPosition?: PositionId
}

type Mode = 'plan' | 'stats' | 'review'

export function GameDayPage({ onGameSaved }: { onGameSaved?: () => void }) {
  const { state, dispatch } = useStore()
  const { game } = state
  const [period, setPeriod] = useState(0)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [mode, setMode] = useState<Mode>('plan')

  const activePeriod = Math.min(period, game.periodCount - 1)
  const lineup = game.periods[activePeriod] ?? {}
  const onFieldIds = new Set(Object.values(lineup).filter(Boolean) as string[])
  const playedCounts = countPeriodsPlayed(game.periods)
  const bench = state.players
    .filter((p) => p.available && !onFieldIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const unavailable = state.players.filter((p) => !p.available)

  const targetPeriods = state.players.filter((p) => p.available).length
    ? Math.round((game.periodCount * 9) / state.players.filter((p) => p.available).length)
    : 0

  function place(position: PositionId, playerId: string, fromPosition?: PositionId) {
    const occupantId = lineup[position]
    dispatch({ type: 'setSlot', period: activePeriod, position, playerId })
    // Dragging between two filled slots swaps the players.
    if (fromPosition && fromPosition !== position && occupantId) {
      dispatch({ type: 'setSlot', period: activePeriod, position: fromPosition, playerId: occupantId })
    }
    setSelection(null)
  }

  function handleSlotClick(position: PositionId) {
    if (selection) {
      place(position, selection.playerId, selection.fromPosition)
    } else if (lineup[position]) {
      setSelection({ playerId: lineup[position]!, fromPosition: position })
    }
  }

  function handleBenchDrop(e: DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData(DND_MIME)
    if (!raw) return
    try {
      const { fromPosition } = JSON.parse(raw) as Selection
      if (fromPosition) {
        dispatch({ type: 'setSlot', period: activePeriod, position: fromPosition, playerId: undefined })
      }
    } catch {
      // ignore malformed drags
    }
  }

  function autoFillPeriod() {
    const filled = suggestLineup(state.players, state.weights, {
      lockedAssignments: lineup,
      playedCounts,
      fairnessWeight: 25,
    })
    dispatch({
      type: 'setPeriods',
      periods: game.periods.map((p, i) => (i === activePeriod ? filled : p)),
    })
  }

  function autoPlanAll() {
    if (
      game.periods.some((p) => Object.keys(p).length > 0) &&
      !confirm('Re-plan all periods? Players you already placed stay where they are.')
    ) {
      return
    }
    dispatch({
      type: 'setPeriods',
      periods: autoPlanGame(state.players, state.weights, game.periods),
    })
  }

  if (mode === 'review') {
    return (
      <section className="page">
        <GameReview
          onDone={() => {
            setMode('plan')
            setPeriod(0)
            onGameSaved?.()
          }}
          onCancel={() => setMode('stats')}
        />
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Game Day</h1>
          <p className="muted">
            {mode === 'plan'
              ? 'Tap a bench player, then tap a spot on the pitch (or drag and drop). Plan each period and keep minutes fair.'
              : 'One tap per event. Tap the period buttons as the game moves along so the right group is on top.'}
          </p>
        </div>
        <div className="toolbar game-info">
          <label className="field inline">
            <span>Opponent</span>
            <input
              value={game.opponent}
              placeholder="vs ..."
              onChange={(e) => dispatch({ type: 'setGameInfo', opponent: e.target.value })}
            />
          </label>
          <label className="field inline">
            <span>Date</span>
            <input
              type="date"
              value={game.date}
              onChange={(e) => dispatch({ type: 'setGameInfo', date: e.target.value })}
            />
          </label>
          <label className="field inline">
            <span>Periods</span>
            <select
              value={game.periodCount}
              onChange={(e) => {
                dispatch({ type: 'setPeriodCount', count: Number(e.target.value) })
                setPeriod(0)
              }}
            >
              {[2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn-secondary danger"
            onClick={() => {
              if (confirm('Start a new game plan? This clears all periods.')) {
                dispatch({ type: 'newGame' })
                setPeriod(0)
              }
            }}
          >
            New game
          </button>
        </div>
      </header>

      <div className="mode-bar">
        <div className="mode-toggle">
          <button className={mode === 'plan' ? 'selected' : ''} onClick={() => setMode('plan')}>
            Lineup
          </button>
          <button className={mode === 'stats' ? 'selected' : ''} onClick={() => setMode('stats')}>
            Live stats
          </button>
        </div>
        <span className="mode-score muted">
          {game.scoreUs}–{game.scoreThem}
        </span>
        <button className="btn-primary" onClick={() => setMode('review')}>
          End game &amp; review
        </button>
      </div>

      <div className="period-bar">
        <div className="period-tabs">
          {game.periods.map((p, i) => (
            <button
              key={i}
              className={`period-tab ${i === activePeriod ? 'selected' : ''}`}
              onClick={() => {
                setPeriod(i)
                setSelection(null)
              }}
            >
              P{i + 1}
              <em>{Object.keys(p).length}/9</em>
            </button>
          ))}
        </div>
        {mode === 'plan' && (
          <div className="toolbar">
            <button className="btn-secondary" onClick={autoFillPeriod}>
              Auto-fill this period
            </button>
            <button className="btn-primary" onClick={autoPlanAll}>
              Auto-plan whole game
            </button>
            <button
              className="btn-ghost danger"
              onClick={() => dispatch({ type: 'clearPeriod', period: activePeriod })}
            >
              Clear period
            </button>
          </div>
        )}
      </div>

      {mode === 'stats' && <LiveStats activePeriod={activePeriod} />}

      <div className="gameday-grid" hidden={mode !== 'plan'}>
        <Pitch
          lineup={lineup}
          players={state.players}
          weights={state.weights}
          interactive
          activePosition={selection?.fromPosition ?? null}
          onSlotClick={handleSlotClick}
          onSlotClear={(pos) =>
            dispatch({ type: 'setSlot', period: activePeriod, position: pos, playerId: undefined })
          }
          onDropPlayer={place}
        />

        <aside className="bench" onDragOver={(e) => e.preventDefault()} onDrop={handleBenchDrop}>
          <h2>
            Bench <span className="muted">({bench.length})</span>
          </h2>
          {selection && !selection.fromPosition && (
            <p className="hint">Now tap a position on the pitch.</p>
          )}
          <ul className="bench-list">
            {bench.map((p) => {
              const selected = selection?.playerId === p.id
              const best = POSITION_IDS.map((pos) => ({
                pos,
                score: fitScore(p.ratings, state.weights[pos]),
              })).sort((a, b) => b.score - a.score)[0]
              return (
                <li key={p.id}>
                  <button
                    className={`bench-player ${selected ? 'selected' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DND_MIME, JSON.stringify({ playerId: p.id }))
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => setSelection(selected ? null : { playerId: p.id })}
                  >
                    <span className="bench-jersey">{p.jersey || '–'}</span>
                    <span className="bench-name">{p.name}</span>
                    <span className="bench-best" style={{ color: scoreColor(best.score) }}>
                      {best.pos} {Math.round(best.score)}
                    </span>
                    <span className="bench-periods" title="Periods in this game plan">
                      {playedCounts[p.id] ?? 0}p
                    </span>
                  </button>
                </li>
              )
            })}
            {bench.length === 0 && <li className="muted empty-bench">Everyone is on the field.</li>}
          </ul>
          {unavailable.length > 0 && (
            <p className="muted small">
              Out today: {unavailable.map((p) => p.name).join(', ')}
            </p>
          )}
        </aside>
      </div>

      <div className="card" hidden={mode !== 'plan'}>
        <h2>Playing time</h2>
        <p className="muted">
          Periods planned per player{targetPeriods > 0 ? ` (even share ≈ ${targetPeriods})` : ''}.
        </p>
        <div className="time-grid">
          {state.players
            .filter((p) => p.available)
            .sort((a, b) => (playedCounts[b.id] ?? 0) - (playedCounts[a.id] ?? 0))
            .map((p) => {
              const count = playedCounts[p.id] ?? 0
              return (
                <div key={p.id} className="time-row">
                  <span className="time-name">
                    {p.jersey && <em>#{p.jersey}</em>} {p.name}
                  </span>
                  <span className="time-dots">
                    {game.periods.map((per, i) => {
                      const pos = (Object.keys(per) as PositionId[]).find((k) => per[k] === p.id)
                      return (
                        <span
                          key={i}
                          className={`time-dot ${pos ? 'on' : ''}`}
                          title={pos ? `P${i + 1}: ${positionById(pos).name}` : `P${i + 1}: bench`}
                        >
                          {pos ?? ''}
                        </span>
                      )
                    })}
                  </span>
                  <strong className="time-count">{count}</strong>
                </div>
              )
            })}
        </div>
      </div>
    </section>
  )
}
