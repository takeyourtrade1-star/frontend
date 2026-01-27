/**
 * Main Entry Point
 * Entry principale dell'applicazione React
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from './app/Router'
import { LanguageProvider } from './contexts/LanguageContext'
import { useAuthStore } from './store/authStore'
import { useActivityStatusStore } from './store/activityStatusStore'
import './styles/globals.css'

// Inizializza autenticazione da localStorage
// Non attendiamo il risultato per non bloccare il rendering iniziale
useAuthStore.getState().initializeAuth().catch(() => {
  // Silently handle initialization errors
})

// Inizializza stato attività da localStorage
useActivityStatusStore.getState().initializeActivityStatus()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router />
    </LanguageProvider>
  </React.StrictMode>
)

