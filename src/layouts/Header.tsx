/**
 * Header Component - Modern Design System
 * Apple-inspired minimal header con responsive scaling incrementale
 * Font: Inter, height: 70px fixed, color: #FFA500
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/ui/Logo'
import HeaderAuthForm from '@/components/header/HeaderAuthForm'
import UserMenu from '@/components/header/UserMenu'
import HeaderMenuButtons from '@/components/header/HeaderMenuButtons'
import SidebarMenu from '@/components/header/SidebarMenu'
import LoginSidebar from '@/components/header/LoginSidebar'
import SearchBar from '@/components/header/SearchBar'
import LanguageSelectorBottomBar from '@/components/header/LanguageSelectorBottomBar'

export default function Header() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuthStore()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoginSidebarOpen, setIsLoginSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setIsSidebarOpen(false)
    navigate('/login')
  }

  const handleOpenLoginSidebar = () => {
    setIsSidebarOpen(false)
    setIsLoginSidebarOpen(true)
  }

  return (
    <>
      {/* Main Header - Fixed 70px */}
      <header 
        className="fixed top-0 left-0 right-0 w-full h-[70px] bg-white z-[1000]"
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e0e0e0',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div className="relative flex items-center h-full max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Logo - Sinistra */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Zona Centrale - Auth Form o User Menu */}
          <div className="flex-1 flex justify-center items-center px-4">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <HeaderAuthForm onOpenLoginSidebar={handleOpenLoginSidebar} />
            )}
          </div>

          {/* Pulsanti Menu - Destra (position absolute per allineamento preciso) */}
          <HeaderMenuButtons
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>
      </header>

      {/* Search Bar fissa sotto l'header */}
      <SearchBar />

      {/* Spacer per compensare l'header fisso */}
      <div className="h-[70px]" />

      {/* Sidebar Menu Principale */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onOpenLoginSidebar={handleOpenLoginSidebar}
      />

      {/* Login Sidebar (Mobile) */}
      <LoginSidebar
        isOpen={isLoginSidebarOpen}
        onClose={() => setIsLoginSidebarOpen(false)}
      />

      {/* Language Selector Bottom Bar (Mobile) */}
      <LanguageSelectorBottomBar />

      {/* Responsive Styles - Media Queries Incrementali */}
      <style>{`
        /* Fine-tune responsive scaling ogni 50px */
        @media (max-width: 1400px) {
          header {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        
        @media (max-width: 1200px) {
          header {
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }
        }
        
        @media (max-width: 1024px) {
          header {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        @media (max-width: 768px) {
          header {
            padding-left: 0.875rem;
            padding-right: 0.875rem;
          }
        }
        
        @media (max-width: 640px) {
          header {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        
        @media (max-width: 480px) {
          header {
            padding-left: 0.625rem;
            padding-right: 0.625rem;
          }
        }
        
        @media (max-width: 360px) {
          header {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }
        
        /* Smooth transitions per tutti gli elementi interattivi */
        header button,
        header a {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Text rendering ottimizzato */
        header {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        /* Prevent layout shift */
        header * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  )
}
