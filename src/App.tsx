import { useState } from 'react'
import './App.css'
import { GameDayPage } from './components/GameDayPage'
import { LineupPage } from './components/LineupPage'
import { PositionsPage } from './components/PositionsPage'
import { RosterPage } from './components/RosterPage'
import { StoreProvider } from './store'

type Tab = 'roster' | 'positions' | 'lineup' | 'gameday'

const TABS: { id: Tab; label: string }[] = [
  { id: 'roster', label: 'Roster' },
  { id: 'positions', label: 'Positions' },
  { id: 'lineup', label: 'Best XI' },
  { id: 'gameday', label: 'Game Day' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('roster')

  return (
    <StoreProvider>
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <span className="brand-ball">⚽</span>
            <div>
              <strong>U12 Coach</strong>
              <span className="brand-sub">3-4-1 · 9v9</span>
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
        </header>
        <main>
          {tab === 'roster' && <RosterPage />}
          {tab === 'positions' && <PositionsPage />}
          {tab === 'lineup' && <LineupPage />}
          {tab === 'gameday' && <GameDayPage />}
        </main>
      </div>
    </StoreProvider>
  )
}
