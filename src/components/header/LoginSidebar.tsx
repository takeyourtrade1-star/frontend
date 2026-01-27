/**
 * LoginSidebar Component
 * Sidebar per login su mobile
 */

import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface LoginSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginSidebar({ isOpen, onClose }: LoginSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login({ email, password })
      onClose()
      // Reindirizza alla pagina salvata o rimani sulla pagina corrente
      const from = (location.state as any)?.from || window.location.pathname
      // Se viene da /login, vai alla dashboard, altrimenti rimani dove sei
      if (from === '/login' || from === '/') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (error) {
      // Silently handle login errors
    }
  }

  const sidebarVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100]"
          />

          {/* Sidebar */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-[320px] md:w-[360px] bg-white shadow-2xl z-[1200] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Accedi</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Login Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="mobile-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="mobile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                               transition-all duration-200"
                      placeholder="tua@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="mobile-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                               transition-all duration-200"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Forgot Password */}
                <Link
                  to="/forgot-password"
                  onClick={onClose}
                  className="block text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Password dimenticata?
                </Link>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 
                           bg-orange-500 text-white rounded-xl font-semibold
                           hover:bg-orange-600 hover:shadow-[0_0_16px_rgba(255,165,0,0.4)]
                           transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Accesso in corso...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Accedi</span>
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Non hai un account?{' '}
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Registrati
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

