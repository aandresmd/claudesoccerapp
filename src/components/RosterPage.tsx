import { useRef, useState } from 'react'
import { emptyRatings } from '../data/attributes'
import { positionById } from '../data/positions'
import { overallRating, positionFits } from '../lib/scoring'
import { newPlayerId, useStore } from '../store'
import type { AppState, Player } from '../types'
import { PositionChip, ScoreBadge } from './common'
import { PlayerEditor } from './PlayerEditor'

export function RosterPage() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState<{ player: Player; isNew: boolean } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const players = [...state.players].sort(
    (a, b) => overallRating(b, state.weights) - overallRating(a, state.weights),
  )

  function addNew() {
    setEditing({
      player: {
        id: newPlayerId(),
        name: '',
        jersey: '',
        available: true,
        notes: '',
        ratings: emptyRatings(),
      },
      isNew: true,
    })
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'u12-coach-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file: File) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as AppState
        if (!Array.isArray(parsed.players) || !parsed.weights || !parsed.game) {
          throw new Error('bad shape')
        }
        dispatch({ type: 'importState', state: parsed })
      } catch {
        alert('That file does not look like an export from this app.')
      }
    })
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Roster</h1>
          <p className="muted">
            Rate each player once; every ranking, suggestion, and lineup updates automatically.
          </p>
        </div>
        <div className="toolbar">
          <button className="btn-primary" onClick={addNew}>
            + Add player
          </button>
          <button className="btn-secondary" onClick={exportJson}>
            Export
          </button>
          <button className="btn-secondary" onClick={() => fileInput.current?.click()}>
            Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
          <button
            className="btn-secondary danger"
            onClick={() => {
              if (confirm('Remove all players and game plans? Export first if unsure.')) {
                dispatch({ type: 'clearAll' })
              }
            }}
          >
            Clear all
          </button>
        </div>
      </header>

      {players.length === 0 ? (
        <div className="empty-state">
          <p>No players yet.</p>
          <button className="btn-primary" onClick={addNew}>
            + Add your first player
          </button>
          <button className="btn-secondary" onClick={() => dispatch({ type: 'loadDemo' })}>
            Load demo roster
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="roster-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th title="Available for the next game">In</th>
                <th title="Fit score in her best position">Overall</th>
                <th>Best positions</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const fits = positionFits(p, state.weights).slice(0, 3)
                return (
                  <tr key={p.id} className={p.available ? '' : 'unavailable'}>
                    <td className="jersey-cell">{p.jersey || '–'}</td>
                    <td className="name-cell">{p.name}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={p.available}
                        onChange={() => dispatch({ type: 'toggleAvailable', id: p.id })}
                        title={p.available ? 'Available' : 'Out (injured/absent)'}
                      />
                    </td>
                    <td>
                      <ScoreBadge
                        score={overallRating(p, state.weights)}
                        title="Fit score in her best position"
                      />
                    </td>
                    <td className="chips-cell">
                      {fits.map((f) => (
                        <PositionChip
                          key={f.position}
                          label={positionById(f.position).id}
                          score={f.score}
                        />
                      ))}
                    </td>
                    <td className="notes-cell muted">{p.notes}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-ghost"
                        onClick={() => setEditing({ player: p, isNew: false })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost danger"
                        onClick={() => {
                          if (confirm(`Remove ${p.name} from the roster?`)) {
                            dispatch({ type: 'deletePlayer', id: p.id })
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PlayerEditor
          player={editing.player}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
