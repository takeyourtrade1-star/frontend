/**
 * ForgotPasswordPage
 * Pagina per richiedere il reset della password
 */

import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await requestPasswordReset({ email })
      setIsSubmitted(true)
      
      // Redirect automatico a login dopo 2 secondi
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      // Silently handle password reset request errors
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="max-w-md w-full">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Richiesta Inviata!
            </h1>
          </div>

          <div className="card p-8">
            {/* Messaggio Generico di Sicurezza */}
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Se esiste un account con questa email, riceverai il link per resettare la password.</p>
                    <p className="mb-2">Controlla anche la cartella spam se nei prossimi 2 minuti non ricevi l'email.</p>
                    <p className="text-xs mt-2 text-blue-700">Se nei prossimi 2 minuti non ricevi l'email, rifai la procedura o contatta l'assistenza.</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Per sicurezza, non riveliamo se l'email è registrata nel sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Reindirizzamento al login...
              </p>
              <Link 
                to="/login" 
                className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Vai al login ora</span>
              </Link>
            </div>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Password Dimenticata?</h1>
          <p className="text-gray-600 mt-2">Inserisci la tua email per ricevere un link di reset</p>
        </div>

        {/* Card Reset Request */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tua@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline mr-2"></div>
                  Invio in corso...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Invia Link di Reset
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna al login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
