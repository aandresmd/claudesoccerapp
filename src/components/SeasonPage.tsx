import { STAT_DEFS } from '../data/stats'
import {
  MIN_GAMES,
  attributeLabel,
  buildSuggestions,
  lowStarFlags,
  scorerSummary,
  seasonLines,
} from '../lib/season'
import { useStore } from '../store'

export function SeasonPage() {
  const { state, dispatch } = useStore()
  const { history, players } = state

  const lines = seasonLines(history)
  const suggestions = buildSuggestions(players, history, state.dismissed)
  const flags = lowStarFlags(history)
  const byId = new Map(players.map((p) => [p.id, p]))
  const name = (id: string) => byId.get(id)?.name ?? 'Former player'

  const tablePlayers = players
    .filter((p) => lines.has(p.id))
    .sort((a, b) => (lines.get(b.id)?.periods ?? 0) - (lines.get(a.id)?.periods ?? 0))

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Season</h1>
          <p className="muted">
            {history.length === 0
              ? 'Finished games land here. Track stats on Game Day, then "End game & review".'
              : `${history.length} game${history.length === 1 ? '' : 's'} tracked. Suggestions appear once a player has ${MIN_GAMES}+ games of evidence.`}
          </p>
        </div>
      </header>

      <div className="card">
        <h2>Rating suggestions</h2>
        {suggestions.length === 0 ? (
          <p className="muted">
            Nothing to suggest yet — that's normal early on. Once a player stands out across{' '}
            {MIN_GAMES}+ games (stat rates well above the team, or repeated review tags), a
            suggested +1 shows up here for you to accept or dismiss. Ratings never change on
            their own.
          </p>
        ) : (
          <div className="suggestion-list">
            {suggestions.map((s) => (
              <div key={s.key} className="suggestion-card">
                <div className="suggestion-text">
                  <strong>
                    {name(s.playerId)}: {attributeLabel(s.attribute)} {s.from} → {s.to}
                  </strong>
                  <span className="muted">{s.reason}</span>
                </div>
                <div className="toolbar">
                  <button
                    className="btn-primary"
                    onClick={() =>
                      dispatch({
                        type: 'setRating',
                        playerId: s.playerId,
                        attribute: s.attribute,
                        value: s.to,
                        suggestionKey: s.key,
                      })
                    }
                  >
                    Apply
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => dispatch({ type: 'dismissSuggestion', key: s.key })}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {flags.length > 0 && (
          <p className="muted small review-flags">
            Worth a second look (consistently low post-game stars):{' '}
            {flags
              .map((f) => `${name(f.playerId)} (${f.avgStars.toFixed(1)}★ over ${f.starGames} games)`)
              .join(', ')}
            . The app never lowers ratings automatically — adjust from the Roster tab if you agree.
          </p>
        )}
      </div>

      {tablePlayers.length > 0 && (
        <div className="card">
          <h2>Season totals</h2>
          <div className="table-wrap">
            <table className="season-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th title="Games played">GP</th>
                  <th title="Periods played">Per</th>
                  {STAT_DEFS.map((d) => (
                    <th key={d.id} title={d.label}>
                      {d.short}
                    </th>
                  ))}
                  <th title="Average post-game stars">★</th>
                </tr>
              </thead>
              <tbody>
                {tablePlayers.map((p) => {
                  const l = lines.get(p.id)!
                  return (
                    <tr key={p.id}>
                      <td className="name-cell">
                        {p.jersey && <em className="jersey-cell">#{p.jersey}</em>} {p.name}
                      </td>
                      <td>{l.games}</td>
                      <td>{l.periods}</td>
                      {STAT_DEFS.map((d) => (
                        <td key={d.id} className={l.totals[d.id] > 0 ? '' : 'muted'}>
                          {l.totals[d.id]}
                        </td>
                      ))}
                      <td>{l.starGames > 0 ? (l.starSum / l.starGames).toFixed(1) : '–'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <h2>Game log</h2>
          <ul className="game-log">
            {history.map((g) => {
              const result =
                g.scoreUs > g.scoreThem ? 'W' : g.scoreUs < g.scoreThem ? 'L' : 'D'
              const scorers = scorerSummary(g, players)
              return (
                <li key={g.id} className="game-log-row">
                  <span className={`result-tag result-${result.toLowerCase()}`}>{result}</span>
                  <span className="game-log-score">
                    {g.scoreUs}–{g.scoreThem}
                  </span>
                  <span className="game-log-main">
                    <strong>vs {g.opponent}</strong>
                    <span className="muted small">
                      {g.date}
                      {scorers ? ` · Goals: ${scorers}` : ''}
                    </span>
                  </span>
                  <button
                    className="btn-ghost danger"
                    onClick={() => {
                      if (confirm(`Delete the game vs ${g.opponent}? Its stats leave the season totals.`)) {
                        dispatch({ type: 'deleteGame', id: g.id })
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
