import { useState } from 'react'
import { STATUS_LABEL, shareLink, useTeamSync } from '../lib/teamSync'
import { useStore } from '../store'

const STATUS_DOT: Record<string, string> = {
  off: 'dot-off',
  connecting: 'dot-pending',
  pending: 'dot-pending',
  synced: 'dot-synced',
  notfound: 'dot-error',
  error: 'dot-error',
}

/** Header control + modal for connecting this device to the shared team data. */
export function TeamSyncControl() {
  const { state, dispatch } = useStore()
  const { teamId, status, createTeam, joinTeam, disconnect } = useTeamSync(state, dispatch)
  const [open, setOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => prompt('Copy this:', text))
  }

  return (
    <>
      <button className="team-sync-btn" onClick={() => setOpen(true)} title="Team sync">
        <span className={`sync-dot ${STATUS_DOT[status]}`} />
        {STATUS_LABEL[status]}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Team sync</h2>
              <button className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>

            {!teamId ? (
              <>
                <p className="muted">
                  Right now this data lives only on this device. Turn on team sync to share one
                  roster, ratings, and season with the other coaches — everyone sees everyone's
                  changes, and it still works offline at the field.
                </p>
                <div className="sync-section">
                  <button className="btn-primary" onClick={() => createTeam()}>
                    Create team sync with this device's data
                  </button>
                  <p className="muted small">
                    Use this on the device that has your real roster. You'll get a private link to
                    send the other coaches.
                  </p>
                </div>
                <div className="sync-section">
                  <h3>Or join an existing team</h3>
                  <div className="form-row">
                    <label className="field grow">
                      <span>Team code</span>
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Paste the team code or link"
                      />
                    </label>
                  </div>
                  <button
                    className="btn-secondary"
                    disabled={!joinCode.trim()}
                    onClick={() => {
                      const raw = joinCode.trim()
                      const fromLink = raw.match(/#team=([\w-]+)/)
                      joinTeam(fromLink ? fromLink[1] : raw)
                      setJoinCode('')
                    }}
                  >
                    Join team
                  </button>
                  <p className="muted small">
                    Joining replaces the data on this device with the team's shared data.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>
                  Status: <strong>{STATUS_LABEL[status]}</strong>
                  {status === 'pending' && (
                    <span className="muted"> — changes are saved and will sync when online.</span>
                  )}
                  {status === 'notfound' && (
                    <span className="muted">
                      {' '}
                      — this team code doesn't exist (check the link, or disconnect and create a
                      new team).
                    </span>
                  )}
                  {status === 'error' && (
                    <span className="muted">
                      {' '}
                      — couldn't reach the team database. Check your connection; changes stay on
                      this device until it reconnects.
                    </span>
                  )}
                </p>
                <div className="sync-section">
                  <h3>Invite the other coaches</h3>
                  <p className="muted small">
                    Anyone who opens this link shares the same live data. Treat it like a private
                    document link — only send it to your coaching staff.
                  </p>
                  <div className="share-row">
                    <code className="share-code">{shareLink(teamId)}</code>
                    <button className="btn-primary" onClick={() => copy(shareLink(teamId))}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
                <div className="sync-section">
                  <button className="btn-secondary danger" onClick={disconnect}>
                    Disconnect this device
                  </button>
                  <p className="muted small">
                    The shared team data stays in the cloud for the other coaches; this device
                    keeps its current copy but stops syncing.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
