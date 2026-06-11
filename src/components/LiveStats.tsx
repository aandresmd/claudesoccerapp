import { useState } from 'react'
import { STAT_DEFS, emptyGameStats } from '../data/stats'
import { positionById } from '../data/positions'
import { useStore } from '../store'
import type { PositionId, StatId } from '../types'

/**
 * Sideline tally screen: one tap per event, with undo. Players on the field
 * in the selected period are listed first; everyone available stays tappable
 * so mid-period subs don't lose their stats.
 */
export function LiveStats({ activePeriod }: { activePeriod: number }) {
  const { state, dispatch } = useStore()
  const [undoStack, setUndoStack] = useState<{ playerId: string; stat: StatId }[]>([])

  const lineup = state.game.periods[activePeriod] ?? {}
  const positionOf = new Map<string, PositionId>()
  for (const [pos, id] of Object.entries(lineup) as [PositionId, string][]) {
    if (id) positionOf.set(id, pos)
  }

  const available = state.players.filter((p) => p.available)
  const onField = available
    .filter((p) => positionOf.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const offField = available
    .filter((p) => !positionOf.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  function tally(playerId: string, stat: StatId) {
    dispatch({ type: 'incrementStat', playerId, stat, delta: 1 })
    setUndoStack((s) => [...s, { playerId, stat }])
  }

  function undo() {
    const last = undoStack[undoStack.length - 1]
    if (!last) return
    dispatch({ type: 'incrementStat', playerId: last.playerId, stat: last.stat, delta: -1 })
    setUndoStack((s) => s.slice(0, -1))
  }

  const playerName = (id: string) => state.players.find((p) => p.id === id)?.name ?? ''
  const lastAction = undoStack[undoStack.length - 1]

  function statRow(playerId: string) {
    const stats = state.game.stats[playerId] ?? emptyGameStats()
    return STAT_DEFS.map((def) => (
      <button
        key={def.id}
        className={`stat-btn ${stats[def.id] > 0 ? 'has-count' : ''}`}
        title={def.hint}
        onClick={() => tally(playerId, def.id)}
      >
        <span className="stat-short">{def.short}</span>
        <span className="stat-count">{stats[def.id]}</span>
      </button>
    ))
  }

  return (
    <div className="livestats">
      <div className="score-bar">
        <div className="score-side">
          <span className="score-team">Us</span>
          <div className="score-stepper">
            <button onClick={() => dispatch({ type: 'setScore', scoreUs: state.game.scoreUs - 1 })}>−</button>
            <strong>{state.game.scoreUs}</strong>
            <button onClick={() => dispatch({ type: 'setScore', scoreUs: state.game.scoreUs + 1 })}>+</button>
          </div>
        </div>
        <span className="score-vs">vs</span>
        <div className="score-side">
          <span className="score-team">{state.game.opponent.trim() || 'Them'}</span>
          <div className="score-stepper">
            <button onClick={() => dispatch({ type: 'setScore', scoreThem: state.game.scoreThem - 1 })}>−</button>
            <strong>{state.game.scoreThem}</strong>
            <button onClick={() => dispatch({ type: 'setScore', scoreThem: state.game.scoreThem + 1 })}>+</button>
          </div>
        </div>
        <button className="btn-secondary" onClick={undo} disabled={!lastAction}>
          {lastAction
            ? `Undo (${playerName(lastAction.playerId)} ${STAT_DEFS.find((d) => d.id === lastAction.stat)?.short})`
            : 'Undo'}
        </button>
      </div>

      <p className="muted small stat-legend">
        {STAT_DEFS.map((d) => `${d.short} = ${d.label}`).join(' · ')}
      </p>

      <h2>On the field — P{activePeriod + 1}</h2>
      <ul className="stat-list">
        {onField.map((p) => (
          <li key={p.id} className="stat-row">
            <span className="stat-pos-tag">{positionOf.get(p.id)}</span>
            <span className="stat-player">
              {p.jersey && <em>#{p.jersey}</em>} {p.name}
            </span>
            <span className="stat-pos-name muted">
              {positionById(positionOf.get(p.id)!).name}
            </span>
            <div className="stat-btns">{statRow(p.id)}</div>
          </li>
        ))}
        {onField.length === 0 && (
          <li className="muted empty-bench">
            No lineup set for this period yet — fill it in on the Lineup view, or tally below.
          </li>
        )}
      </ul>

      {offField.length > 0 && (
        <>
          <h2 className="muted">On the bench</h2>
          <ul className="stat-list off-field">
            {offField.map((p) => (
              <li key={p.id} className="stat-row">
                <span className="stat-pos-tag bench-tag">—</span>
                <span className="stat-player">
                  {p.jersey && <em>#{p.jersey}</em>} {p.name}
                </span>
                <span className="stat-pos-name muted">Bench</span>
                <div className="stat-btns">{statRow(p.id)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
