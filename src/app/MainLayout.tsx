/**
 * MainLayout
 * Layout principale con Header, Footer e Background Video
 */

import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import BackgroundVideo from '@/components/layout/BackgroundVideo'
import ActivityStatusBanner from '@/components/ui/ActivityStatusBanner'
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner'
import ThemeEffect from '@/components/theme/ThemeEffect'

export default function MainLayout() {
  const { user, isAuthenticated } = useAuthStore()

  // Verifica se l'utente è autenticato ma non ha verificato l'email
  const needsEmailVerification = isAuthenticated && user && (
    !user.email_verified_at || 
    user.account_status === 'pending_verification' ||
    (user.verified === false && !user.email_verified_at)
  )

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Applica tema da user.preferences.theme (light/dark/system) */}
      <ThemeEffect />
      {/* Background Video - Posizionato sotto tutto il contenuto */}
      <BackgroundVideo />
      
      {/* Header e contenuto principale */}
      <Header />
      
      {/* Activity Status Banner */}
      <ActivityStatusBanner />
      
      {/* Email Verification Banner - Mostra solo se l'utente non ha verificato l'email */}
      {needsEmailVerification && (
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <EmailVerificationBanner />
          </div>
        </div>
      )}
      
      <main className="relative flex-1 z-10 pb-20 md:pb-0">
        <Outlet />
      </main>
      
      <Footer />
      <Toaster position="top-center" />
    </div>
  )
}

