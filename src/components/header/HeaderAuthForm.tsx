/**
 * HeaderAuthForm Component
 * Form di login inline per utenti non loggati
 */

import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface HeaderAuthFormProps {
  onOpenLoginSidebar?: () => void
}

export default function HeaderAuthForm({ onOpenLoginSidebar }: HeaderAuthFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login({ email, password })
      // Reindirizza alla pagina salvata o rimani sulla pagina corrente
      const from = (location.state as any)?.from || window.location.pathname
      // Se viene da /login o è la home, vai alla dashboard, altrimenti rimani dove sei
      if (from === '/login' || from === '/') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (error) {
      // Silently handle login errors
    }
  }

  return (
    <>
      {/* Desktop - Form inline */}
      <form 
        onSubmit={handleSubmit}
        className="hidden lg:flex items-center gap-3"
      >
        {/* Email/Username Input */}
        <div className="relative">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email / Username"
            className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     transition-all duration-200"
            required
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-48 px-3 py-2 pr-24 text-sm border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     transition-all duration-200"
            required
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <Link
              to="/forgot-password"
              className="text-[10px] text-gray-500 hover:text-orange-500 transition-colors whitespace-nowrap"
            >
              DIMENTICATO?
            </Link>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 min-h-[40px]
                   bg-white border-2 border-orange-500 text-orange-500 rounded-lg
                   font-semibold text-sm
                   hover:bg-orange-50 hover:shadow-[0_0_12px_rgba(255,165,0,0.4)]
                   transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogIn className="w-4 h-4" />
          <span>LOG IN</span>
        </button>

        {/* Register Button */}
        <Link
          to="/register"
          className="flex items-center gap-2 px-4 py-2 min-h-[40px]
                   bg-orange-500 text-white rounded-lg
                   font-semibold text-sm
                   hover:bg-orange-600 hover:shadow-[0_0_12px_rgba(255,165,0,0.4)]
                   transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          <span>REGISTRATI</span>
        </Link>
      </form>

      {/* Mobile - Pulsanti rimossi, accesso tramite hamburger menu */}
    </>
  )
}

