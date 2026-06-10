import { POSITIONS } from '../data/positions'
import { fitScore, scoreColor } from '../lib/scoring'
import { alternativesForPosition, suggestLineup } from '../lib/suggest'
import { useStore } from '../store'
import { Pitch } from './Pitch'

export function LineupPage() {
  const { state, dispatch } = useStore()
  const available = state.players.filter((p) => p.available)
  const lineup = suggestLineup(state.players, state.weights)
  const byId = new Map(state.players.map((p) => [p.id, p]))

  const assigned = POSITIONS.map((pos) => {
    const player = lineup[pos.id] ? byId.get(lineup[pos.id]!) : undefined
    const score = player ? fitScore(player.ratings, state.weights[pos.id]) : undefined
    return { pos, player, score }
  })
  const filled = assigned.filter((a) => a.score !== undefined)
  const avg =
    filled.length > 0
      ? filled.reduce((sum, a) => sum + (a.score ?? 0), 0) / filled.length
      : 0

  const matrixPlayers = [...state.players].sort((a, b) => Number(b.available) - Number(a.available))

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Suggested Best XI</h1>
          <p className="muted">
            The strongest possible 3-4-1 from your {available.length} available player
            {available.length === 1 ? '' : 's'} — each player is placed where she helps the team
            most, not just at her own best score.
          </p>
        </div>
        <div className="toolbar">
          <span className="stat-pill">
            Team fit <strong style={{ color: scoreColor(avg) }}>{Math.round(avg)}</strong>
          </span>
          <button
            className="btn-primary"
            onClick={() => {
              dispatch({ type: 'setPeriods', periods: state.game.periods.map(() => ({ ...lineup })) })
            }}
            disabled={filled.length === 0}
            title="Copy this lineup into every period of the Game Day plan"
          >
            Send to Game Day →
          </button>
        </div>
      </header>

      {available.length < 9 && (
        <p className="warning-banner">
          Only {available.length} players are marked available — some positions will be empty.
          Toggle availability on the Roster tab.
        </p>
      )}

      <div className="lineup-grid">
        <Pitch lineup={lineup} players={state.players} weights={state.weights} />
        <div className="lineup-cards">
          {assigned.map(({ pos, player, score }) => {
            const alts = alternativesForPosition(
              state.players,
              state.weights,
              pos.id,
              player?.id,
              2,
            )
            return (
              <div key={pos.id} className="lineup-card">
                <div className="lineup-card-head">
                  <span className={`pos-tag group-${pos.group.toLowerCase()}`}>{pos.id}</span>
                  <span className="lineup-pos-name">{pos.name}</span>
                </div>
                {player ? (
                  <div className="lineup-pick">
                    <strong>
                      {player.jersey && <em>#{player.jersey}</em>} {player.name}
                    </strong>
                    <span className="score-badge" style={{ background: scoreColor(score ?? 0) }}>
                      {Math.round(score ?? 0)}
                    </span>
                  </div>
                ) : (
                  <div className="lineup-pick muted">No player available</div>
                )}
                {alts.length > 0 && (
                  <div className="lineup-alts muted">
                    Backup{alts.length > 1 ? 's' : ''}:{' '}
                    {alts.map((a, i) => (
                      <span key={a.player.id}>
                        {i > 0 && ', '}
                        {a.player.name} ({Math.round(a.score)})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h2>Full fit matrix</h2>
        <p className="muted">
          Every player's fit score for every position. Green ring = where the suggested lineup
          plays her.
        </p>
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Player</th>
                {POSITIONS.map((p) => (
                  <th key={p.id} title={p.name}>
                    {p.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixPlayers.map((player) => (
                <tr key={player.id} className={player.available ? '' : 'unavailable'}>
                  <td className="name-cell">
                    {player.name}
                    {!player.available && <span className="out-tag">out</span>}
                  </td>
                  {POSITIONS.map((pos) => {
                    const score = fitScore(player.ratings, state.weights[pos.id])
                    const picked = lineup[pos.id] === player.id
                    return (
                      <td key={pos.id} className={picked ? 'picked-cell' : ''}>
                        <span className="matrix-score" style={{ color: scoreColor(score) }}>
                          {Math.round(score)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
