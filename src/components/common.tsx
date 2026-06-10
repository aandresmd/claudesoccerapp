import { scoreColor } from '../lib/scoring'

export function ScoreBadge({ score, title }: { score: number; title?: string }) {
  return (
    <span className="score-badge" style={{ background: scoreColor(score) }} title={title}>
      {Math.round(score)}
    </span>
  )
}

export function PositionChip({ label, score }: { label: string; score?: number }) {
  return (
    <span className="pos-chip">
      {label}
      {score !== undefined && (
        <em style={{ color: scoreColor(score) }}>{Math.round(score)}</em>
      )}
    </span>
  )
}
