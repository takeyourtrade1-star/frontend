/**
 * ThemeEffect
 * Applica il tema (light/dark/system) da user.preferences o localStorage al documento.
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const THEME_STORAGE_KEY = 'tyt_theme'

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  let isDark = false
  if (theme === 'dark') isDark = true
  else if (theme === 'system') isDark = getSystemDark()
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export default function ThemeEffect() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    let theme: 'light' | 'dark' | 'system' = 'system'
    if (isAuthenticated && user?.preferences?.theme) {
      theme = user.preferences.theme
    } else {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored === 'light' || stored === 'dark' || stored === 'system') theme = stored
      } catch (_) {}
    }
    applyTheme(theme)
  }, [isAuthenticated, user?.preferences?.theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const theme = (isAuthenticated && user?.preferences?.theme) ?? localStorage.getItem(THEME_STORAGE_KEY) ?? 'system'
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [isAuthenticated, user?.preferences?.theme])

  return null
}

export { THEME_STORAGE_KEY }
