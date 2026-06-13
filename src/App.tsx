import { useState } from 'react'
import './App.css'
import { GameDayPage } from './components/GameDayPage'
import { LineupPage } from './components/LineupPage'
import { PositionsPage } from './components/PositionsPage'
import { RosterPage } from './components/RosterPage'
import { SeasonPage } from './components/SeasonPage'
import { TeamSyncControl } from './components/TeamSync'
import { StoreProvider } from './store'

type Tab = 'roster' | 'positions' | 'lineup' | 'gameday' | 'season'

const TABS: { id: Tab; label: string }[] = [
  { id: 'roster', label: 'Roster' },
  { id: 'positions', label: 'Positions' },
  { id: 'lineup', label: 'Best XI' },
  { id: 'gameday', label: 'Game Day' },
  { id: 'season', label: 'Season' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('roster')

  return (
    <StoreProvider>
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <img
              className="brand-badge"
              src={`${import.meta.env.BASE_URL}carmel-fc.svg`}
              alt="Carmel FC badge"
            />
            <div>
              <strong>U12 Coach</strong>
              <span className="brand-sub">Carmel FC · 3-4-1 · 9v9</span>
            </div>
          </div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'selected' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <TeamSyncControl />
        </header>
        <main>
          {tab === 'roster' && <RosterPage />}
          {tab === 'positions' && <PositionsPage />}
          {tab === 'lineup' && <LineupPage />}
          {tab === 'gameday' && <GameDayPage onGameSaved={() => setTab('season')} />}
          {tab === 'season' && <SeasonPage />}
        </main>
      </div>
    </StoreProvider>
  )
}
