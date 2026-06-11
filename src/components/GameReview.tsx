import { useState } from 'react'
import { REVIEW_TAGS, STAT_DEFS, emptyGameStats } from '../data/stats'
import { countPeriodsPlayed } from '../lib/suggest'
import { useStore } from '../store'
import type { PlayerReview } from '../types'

/**
 * The 60-second post-game review: optional stars and one-tap tags per player.
 * Saving archives the whole game (lineups, stats, score, reviews) to Season.
 */
export function GameReview({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { state, dispatch } = useStore()
  const [reviews, setReviews] = useState<Record<string, PlayerReview>>({})

  const periodCounts = countPeriodsPlayed(state.game.periods)
  const players = state.players
    .filter((p) => {
      const stats = state.game.stats[p.id]
      return p.available || (periodCounts[p.id] ?? 0) > 0 || (stats && STAT_DEFS.some((s) => stats[s.id] > 0))
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const review = (id: string): PlayerReview => reviews[id] ?? { stars: 0, tags: [] }

  function setStars(id: string, stars: number) {
    const r = review(id)
    setReviews({ ...reviews, [id]: { ...r, stars: r.stars === stars ? 0 : stars } })
  }

  function toggleTag(id: string, tagId: string) {
    const r = review(id)
    const tags = r.tags.includes(tagId) ? r.tags.filter((t) => t !== tagId) : [...r.tags, tagId]
    setReviews({ ...reviews, [id]: { ...r, tags } })
  }

  function save() {
    const cleaned: Record<string, PlayerReview> = {}
    for (const [id, r] of Object.entries(reviews)) {
      if (r.stars > 0 || r.tags.length > 0) cleaned[id] = r
    }
    dispatch({ type: 'finalizeGame', reviews: cleaned })
    onDone()
  }

  const opponent = state.game.opponent.trim() || 'Opponent'

  return (
    <div className="review">
      <div className="card review-head">
        <div>
          <h2>
            Post-game review — vs {opponent}, {state.game.scoreUs}–{state.game.scoreThem}
          </h2>
          <p className="muted">
            Optional but quick: rate the game 1–5 stars and tap anything that stood out. Tags feed
            the season rating suggestions. Skip anyone you're unsure about.
          </p>
        </div>
        <div className="toolbar">
          <button className="btn-secondary" onClick={onCancel}>
            Back to game
          </button>
          <button className="btn-primary" onClick={save}>
            Save game to Season
          </button>
        </div>
      </div>

      {players.map((p) => {
        const r = review(p.id)
        const stats = state.game.stats[p.id] ?? emptyGameStats()
        const statLine = STAT_DEFS.filter((d) => stats[d.id] > 0)
          .map((d) => `${stats[d.id]} ${d.label.toLowerCase()}`)
          .join(', ')
        return (
          <div key={p.id} className="card review-card">
            <div className="review-player">
              <strong>
                {p.jersey && <em>#{p.jersey}</em>} {p.name}
              </strong>
              <span className="muted small">
                {periodCounts[p.id] ?? 0} period{(periodCounts[p.id] ?? 0) === 1 ? '' : 's'}
                {statLine ? ` · ${statLine}` : ''}
              </span>
              <div className="star-picker" role="radiogroup" aria-label={`${p.name} game rating`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`star ${r.stars >= n ? 'on' : ''}`}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onClick={() => setStars(p.id, n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="tag-row">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  className={`tag-chip ${r.tags.includes(tag.id) ? 'on' : ''}`}
                  onClick={() => toggleTag(p.id, tag.id)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
