import type { DragEvent } from 'react'
import { POSITIONS } from '../data/positions'
import { fitScore, scoreColor } from '../lib/scoring'
import type { PeriodLineup, Player, PositionId, WeightProfiles } from '../types'

export interface PitchProps {
  lineup: PeriodLineup
  players: Player[]
  weights: WeightProfiles
  /** Position currently highlighted (e.g. waiting for a player to be placed). */
  activePosition?: PositionId | null
  /** Player id currently selected from the bench, if any. */
  interactive?: boolean
  onSlotClick?: (position: PositionId) => void
  onSlotClear?: (position: PositionId) => void
  onDropPlayer?: (position: PositionId, playerId: string, fromPosition?: PositionId) => void
}

export const DND_MIME = 'application/x-soccer-player'

export function Pitch({
  lineup,
  players,
  weights,
  activePosition,
  interactive = false,
  onSlotClick,
  onSlotClear,
  onDropPlayer,
}: PitchProps) {
  const byId = new Map(players.map((p) => [p.id, p]))

  function handleDrop(e: DragEvent, position: PositionId) {
    e.preventDefault()
    const raw = e.dataTransfer.getData(DND_MIME)
    if (!raw) return
    try {
      const { playerId, fromPosition } = JSON.parse(raw) as {
        playerId: string
        fromPosition?: PositionId
      }
      onDropPlayer?.(position, playerId, fromPosition)
    } catch {
      // ignore malformed drags
    }
  }

  function handleDragStart(e: DragEvent, playerId: string, fromPosition: PositionId) {
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ playerId, fromPosition }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="pitch" role="group" aria-label="Formation pitch, 3-4-1">
      <div className="pitch-markings">
        <div className="center-circle" />
        <div className="halfway-line" />
        <div className="penalty-box top" />
        <div className="penalty-box bottom" />
        <div className="goal-box top" />
        <div className="goal-box bottom" />
      </div>
      {POSITIONS.map((pos) => {
        const playerId = lineup[pos.id]
        const player = playerId ? byId.get(playerId) : undefined
        const score = player ? fitScore(player.ratings, weights[pos.id]) : undefined
        const classes = [
          'pitch-slot',
          player ? 'filled' : 'empty',
          activePosition === pos.id ? 'active' : '',
          interactive ? 'interactive' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <div
            key={pos.id}
            className={classes}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => onSlotClick?.(pos.id)}
            onDragOver={interactive ? (e) => e.preventDefault() : undefined}
            onDrop={interactive ? (e) => handleDrop(e, pos.id) : undefined}
            draggable={interactive && !!player}
            onDragStart={
              interactive && player ? (e) => handleDragStart(e, player.id, pos.id) : undefined
            }
            title={pos.name}
          >
            <span className="slot-pos">{pos.id}</span>
            {player ? (
              <>
                <span className="slot-jersey">{player.jersey || '–'}</span>
                <span className="slot-name">{player.name}</span>
                {score !== undefined && (
                  <span className="slot-score" style={{ background: scoreColor(score) }}>
                    {Math.round(score)}
                  </span>
                )}
                {interactive && onSlotClear && (
                  <button
                    className="slot-clear"
                    aria-label={`Remove ${player.name} from ${pos.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSlotClear(pos.id)
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            ) : (
              <span className="slot-empty-label">{pos.name}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
