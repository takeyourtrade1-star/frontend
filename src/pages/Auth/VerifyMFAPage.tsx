/**
 * VerifyMFAPage
 * Pagina di verifica MFA dopo il login
 */

import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Shield } from 'lucide-react'

export default function VerifyMFAPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyMFA, isLoading, error, clearError } = useAuthStore()
  
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  
  // Get preAuthToken and redirect info from location state
  const preAuthToken = (location.state as any)?.preAuthToken
  const email = (location.state as any)?.email
  const redirectTo = (location.state as any)?.from || '/dashboard'

  // Redirect if no preAuthToken
  useEffect(() => {
    if (!preAuthToken) {
      navigate('/login', { replace: true })
    }
  }, [preAuthToken, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setMfaError('')
    
    if (!mfaCode || mfaCode.length < 4) {
      setMfaError('Inserisci un codice MFA valido')
      return
    }
    
    if (!preAuthToken) {
      setMfaError('Token di autenticazione mancante. Riprova il login.')
      navigate('/login', { replace: true })
      return
    }
    
    try {
      await verifyMFA({
        pre_auth_token: preAuthToken,
        mfa_code: mfaCode
      })
      
      // Success - redirect to intended destination
      navigate(redirectTo, { replace: true })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Codice MFA non valido'
      setMfaError(errorMessage)
    }
  }

  // Show loading if no preAuthToken yet
  if (!preAuthToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-orange-500 text-white font-bold text-3xl px-6 py-3 rounded-2xl mb-4">
            TYT
          </div>
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verifica MFA</h1>
          <p className="text-gray-600 mt-2">
            Inserisci il codice di autenticazione a due fattori
          </p>
          {email && (
            <p className="text-sm text-gray-500 mt-1">
              Account: {email}
            </p>
          )}
        </div>

        {/* Card MFA */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* MFA Code */}
            <div>
              <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-2">
                Codice MFA
              </label>
              <input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(e) => {
                  setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setMfaError('')
                }}
                className="input-field text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                disabled={isLoading}
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Inserisci il codice a 6 cifre dal tuo autenticatore
              </p>
            </div>

            {/* Error Message */}
            {(error || mfaError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {mfaError || error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || mfaCode.length < 4}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Verifica in corso...</span>
                </>
              ) : (
                'Verifica'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3">
            <Link
              to="/login"
              className="flex items-center justify-center text-sm text-orange-500 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
