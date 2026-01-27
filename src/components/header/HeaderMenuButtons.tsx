/**
 * HeaderMenuButtons Component
 * Pulsanti a destra dell'header (Home, Logout, Hamburger)
 */

import { Link } from 'react-router-dom'
import { Home, LogOut, Menu as MenuIcon } from 'lucide-react'

interface HeaderMenuButtonsProps {
  isAuthenticated: boolean
  onLogout: () => void
  onToggleSidebar: () => void
}

export default function HeaderMenuButtons({ 
  isAuthenticated, 
  onLogout, 
  onToggleSidebar 
}: HeaderMenuButtonsProps) {
  return (
    <div className="absolute top-1/2 right-8 lg:right-8 -translate-y-1/2 flex items-center gap-2">
      {isAuthenticated && (
        <>
          {/* Home Button */}
          <Link
            to="/dashboard"
            className="w-8 h-8 flex items-center justify-center
                     bg-gray-50 border border-gray-200 rounded-lg
                     text-gray-600
                     hover:bg-gray-100 hover:border-gray-300
                     active:bg-gray-200
                     transition-all duration-150"
            style={{
              borderWidth: '0.5px',
            }}
            title="Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 flex items-center justify-center
                     bg-gray-50 border border-gray-200 rounded-lg
                     text-gray-600
                     hover:bg-gray-100 hover:border-gray-300
                     active:bg-gray-200
                     transition-all duration-150"
            style={{
              borderWidth: '0.5px',
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Hamburger Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 flex items-center justify-center
                 bg-gray-50 border border-gray-200 rounded-lg
                 text-gray-600
                 hover:bg-gray-100 hover:border-gray-300
                 active:bg-gray-200
                 transition-all duration-150"
        style={{
          borderWidth: '0.5px',
        }}
        title="Menu"
      >
        <MenuIcon className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  )
}

