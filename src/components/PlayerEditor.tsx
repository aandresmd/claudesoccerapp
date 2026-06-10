import { useState } from 'react'
import { ATTRIBUTES, RATING_LABELS, RATING_MAX, RATING_MIN, emptyRatings } from '../data/attributes'
import { positionById } from '../data/positions'
import { positionFits } from '../lib/scoring'
import { useStore } from '../store'
import type { Player } from '../types'
import { PositionChip } from './common'

export interface PlayerEditorProps {
  player: Player
  isNew: boolean
  onClose: () => void
}

export function PlayerEditor({ player, isNew, onClose }: PlayerEditorProps) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<Player>(() => ({
    ...player,
    ratings: { ...emptyRatings(), ...player.ratings },
  }))

  const fits = positionFits(draft, state.weights).slice(0, 3)

  function save() {
    const cleaned = { ...draft, name: draft.name.trim() || 'Unnamed player' }
    dispatch(isNew ? { type: 'addPlayer', player: cleaned } : { type: 'updatePlayer', player: cleaned })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isNew ? 'Add player' : `Edit ${player.name}`}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="form-row">
          <label className="field grow">
            <span>Name</span>
            <input
              value={draft.name}
              autoFocus={isNew}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Player name"
            />
          </label>
          <label className="field jersey-field">
            <span>Jersey #</span>
            <input
              value={draft.jersey}
              onChange={(e) => setDraft({ ...draft, jersey: e.target.value })}
              placeholder="#"
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="field">
          <span>Coach notes</span>
          <input
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="e.g. prefers left foot, loves playing keeper"
          />
        </label>

        <h3>Attributes</h3>
        <p className="muted">
          Rate each skill 1 (developing) to 5 (excellent) relative to the age group.
        </p>
        <div className="slider-grid">
          {ATTRIBUTES.map((a) => {
            const value = draft.ratings[a.id]
            return (
              <label key={a.id} className="slider-row" title={a.hint}>
                <span className="slider-label">{a.label}</span>
                <input
                  type="range"
                  min={RATING_MIN}
                  max={RATING_MAX}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ratings: { ...draft.ratings, [a.id]: Number(e.target.value) },
                    })
                  }
                />
                <span className="slider-value" data-value={value}>
                  {value} · {RATING_LABELS[value]}
                </span>
              </label>
            )
          })}
        </div>

        <div className="fit-preview">
          <span className="muted">Best positions with these ratings:</span>
          {fits.map((f) => (
            <PositionChip key={f.position} label={positionById(f.position).name} score={f.score} />
          ))}
        </div>

        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            {isNew ? 'Add player' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  )
}
