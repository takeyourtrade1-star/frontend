/**
 * App entry point - mounts React app with Router and providers
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '@/contexts/LanguageContext'
import Router from '@/app/Router'
import '@/styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router />
    </LanguageProvider>
  </React.StrictMode>
)
