import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { adoptTeamFromUrl } from './lib/teamSync.ts'

// Handle "join team" share links before the app (and its store) first renders.
adoptTeamFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
