import { useState } from 'react'
import { ATTRIBUTES } from '../data/attributes'
import { POSITIONS, positionById } from '../data/positions'
import { rankPlayersForPosition } from '../lib/scoring'
import { useStore } from '../store'
import type { PositionId } from '../types'
import { ScoreBadge } from './common'

const WEIGHT_LABELS = ['Not needed', 'Nice to have', 'Helpful', 'Important', 'Very important', 'Critical']

export function PositionsPage() {
  const { state, dispatch } = useStore()
  const [selected, setSelected] = useState<PositionId>('GK')

  const pos = positionById(selected)
  const weights = state.weights[selected]
  const ranked = rankPlayersForPosition(state.players, state.weights, selected)

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Position Profiles</h1>
          <p className="muted">
            Set how much each trait matters per position in the 3-4-1. These weights drive every
            rating and lineup suggestion.
          </p>
        </div>
      </header>

      <div className="position-tabs">
        {POSITIONS.map((p) => (
          <button
            key={p.id}
            className={`pos-tab ${p.id === selected ? 'selected' : ''} group-${p.group.toLowerCase()}`}
            onClick={() => setSelected(p.id)}
          >
            {p.id}
          </button>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2>
              {pos.name} <span className="muted">({pos.group})</span>
            </h2>
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'resetWeights', position: selected })}
            >
              Reset to default
            </button>
          </div>
          <p className="muted">{pos.description}</p>
          <div className="slider-grid">
            {ATTRIBUTES.map((a) => {
              const value = weights[a.id]
              return (
                <label key={a.id} className="slider-row" title={a.hint}>
                  <span className="slider-label">{a.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={value}
                    onChange={(e) =>
                      dispatch({
                        type: 'setWeights',
                        position: selected,
                        weights: { ...weights, [a.id]: Number(e.target.value) },
                      })
                    }
                  />
                  <span className="slider-value" data-value={value}>
                    {value} · {WEIGHT_LABELS[value]}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h2>Who fits {pos.name}?</h2>
          <p className="muted">Whole roster ranked by fit for this position.</p>
          <ol className="ranking-list">
            {ranked.map(({ player, score }, i) => (
              <li key={player.id} className={player.available ? '' : 'unavailable'}>
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">
                  {player.jersey && <em>#{player.jersey}</em>} {player.name}
                  {!player.available && <span className="out-tag">out</span>}
                </span>
                <ScoreBadge score={score} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
