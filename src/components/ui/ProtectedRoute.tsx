/**
 * ProtectedRoute Component
 * Protegge le route che richiedono autenticazione.
 * Redirect strict: se onboarding non completato → /onboarding; se su /onboarding e completato → /dashboard.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Se true (default), richiede onboarding completato; se false, è la pagina onboarding */
  requireOnboardingCompleted?: boolean
}

export default function ProtectedRoute({ children, requireOnboardingCompleted = true }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const pathname = location.pathname
  const onboardingCompleted = user?.preferences?.is_onboarding_completed ?? false

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: pathname }} replace />
  }

  // Authenticated + onboarding not completed → must go to onboarding
  if (!onboardingCompleted) {
    if (pathname === '/onboarding') {
      return <>{children}</>
    }
    return <Navigate to="/onboarding" state={{ from: pathname }} replace />
  }

  // Authenticated + onboarding completed + user is on /onboarding → redirect to dashboard (no loop back)
  if (pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

