import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Action } from '../store'
import type { AppState } from '../types'
import { db } from './firebase'
import { stableStringify } from './stableJson'

const TEAM_KEY = 'u12-coach-team'
const WRITE_DEBOUNCE_MS = 800

export type SyncStatus =
  | 'off' // no team connected; data stays on this device
  | 'connecting'
  | 'synced'
  | 'pending' // change saved locally, waiting for the server (e.g. offline)
  | 'notfound' // joined a team code that doesn't exist
  | 'error'

export const STATUS_LABEL: Record<SyncStatus, string> = {
  off: 'This device only',
  connecting: 'Connecting…',
  synced: 'Synced',
  pending: 'Saving…',
  notfound: 'Team not found',
  error: 'Sync error',
}

export function loadTeamId(): string | null {
  try {
    return localStorage.getItem(TEAM_KEY)
  } catch {
    return null
  }
}

/**
 * Keeps the whole AppState mirrored into one Firestore document per team.
 *
 * Remote snapshots are imported into the local store; local changes are
 * debounced and written back. Last write wins, which is fine for a coaching
 * staff of two or three. Writes are gated until the first snapshot arrives so
 * joining a team can never overwrite the team's data with this device's copy.
 */
export function useTeamSync(state: AppState, dispatch: (action: Action) => void) {
  const [teamId, setTeamId] = useState<string | null>(loadTeamId)
  const [status, setStatus] = useState<SyncStatus>(teamId ? 'connecting' : 'off')

  const stateJson = stableStringify(state)
  const stateRef = useRef(stateJson)
  /**
   * The state content the server last delivered. Imports happen only when
   * this changes, so a re-delivered snapshot after a connection blip can
   * never overwrite newer local edits that are still waiting to upload.
   */
  const lastRemote = useRef<string | null>(null)
  const ready = useRef(false)

  useEffect(() => {
    stateRef.current = stateJson
  }, [stateJson])

  useEffect(() => {
    if (!teamId) return
    ready.current = false
    const unsubscribe = onSnapshot(
      doc(db, 'teams', teamId),
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.exists()) {
          // Only trust "missing" once the server (not just the cache) says so.
          if (!snap.metadata.fromCache) setStatus('notfound')
          return
        }
        ready.current = true
        const remote = snap.data().state as AppState | undefined
        if (remote) {
          const remoteJson = stableStringify(remote)
          if (remoteJson !== lastRemote.current) {
            lastRemote.current = remoteJson
            if (remoteJson !== stateRef.current) {
              dispatch({ type: 'importState', state: remote })
            }
          }
        }
        setStatus(snap.metadata.hasPendingWrites || snap.metadata.fromCache ? 'pending' : 'synced')
      },
      () => setStatus('error'),
    )
    return unsubscribe
  }, [teamId, dispatch])

  useEffect(() => {
    if (!teamId || !ready.current || stateJson === lastRemote.current) return
    const timer = setTimeout(() => {
      setDoc(doc(db, 'teams', teamId), {
        // Round-trip through JSON strips any undefined values Firestore rejects.
        state: JSON.parse(stateJson) as AppState,
        updatedAt: serverTimestamp(),
      }).catch(() => setStatus('error'))
    }, WRITE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [stateJson, teamId])

  const createTeam = useCallback(() => {
    const id = crypto.randomUUID()
    setDoc(doc(db, 'teams', id), {
      state: JSON.parse(stateRef.current) as AppState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(() => setStatus('error'))
    lastRemote.current = stateRef.current
    try {
      localStorage.setItem(TEAM_KEY, id)
    } catch {
      // private browsing: sync still works for this session
    }
    setStatus('connecting')
    setTeamId(id)
    return id
  }, [])

  const joinTeam = useCallback((code: string) => {
    const id = code.trim()
    if (!id) return
    try {
      localStorage.setItem(TEAM_KEY, id)
    } catch {
      // private browsing: sync still works for this session
    }
    setStatus('connecting')
    setTeamId(id)
  }, [])

  const disconnect = useCallback(() => {
    try {
      localStorage.removeItem(TEAM_KEY)
    } catch {
      // ignore
    }
    setStatus('off')
    setTeamId(null)
  }, [])

  return { teamId, status, createTeam, joinTeam, disconnect }
}

export function shareLink(teamId: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#team=${teamId}`
}

/** Team code from an opened share link, if any (consumes the URL hash). */
function teamIdFromUrl(): string | null {
  const match = window.location.hash.match(/#team=([\w-]+)/)
  if (!match) return null
  history.replaceState(null, '', window.location.pathname + window.location.search)
  return match[1]
}

/**
 * Called once at startup, before React renders: if the app was opened via a
 * share link, offer to connect this device to that team.
 */
export function adoptTeamFromUrl(): void {
  const code = teamIdFromUrl()
  if (!code || code === loadTeamId()) return
  if (
    confirm(
      'Connect this device to the shared team? It will sync to the team data (replacing whatever is currently on this device).',
    )
  ) {
    try {
      localStorage.setItem(TEAM_KEY, code)
    } catch {
      // private browsing: nothing to persist
    }
  }
}
