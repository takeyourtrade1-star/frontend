/**
 * EmailVerificationBanner
 * Banner che appare nella dashboard se l'email non è verificata
 */

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Mail, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export default function EmailVerificationBanner() {
  const { user, sendEmailVerification, verifyEmailCode, isLoading } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  // Verifica se l'email è verificata
  // Controlla multiple condizioni per compatibilità con diversi backend
  const isEmailVerified = 
    (user?.email_verified_at !== null && user?.email_verified_at !== undefined) ||
    (user?.verified === true && user?.email_verified_at !== null) ||
    (user?.account_status && user?.account_status !== 'pending_verification' && user?.email_verified_at)

  // Se l'email è già verificata o non c'è utente, non mostrare il banner
  if (isEmailVerified || !user) {
    return null
  }

  const handleSendCode = async () => {
    try {
      await sendEmailVerification()
      setSendSuccess(true)
      setTimeout(() => setSendSuccess(false), 3000)
    } catch (error) {
      // Silently handle verification code sending errors
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError('')
    
    if (!code || code.length !== 6) {
      setCodeError('Il codice deve essere di 6 cifre')
      return
    }

    setIsSubmitting(true)
    
    try {
      await verifyEmailCode({ code })
      // Il banner si nasconderà automaticamente perché user.verified sarà aggiornato
      setShowModal(false)
      setCode('')
    } catch (error: any) {
      setCodeError(error.response?.data?.message || error.message || 'Codice non valido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              ⚠ Verifica la tua email
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Ti abbiamo inviato un codice di verifica di 6 cifre. Controlla la tua casella email ({user.email}).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Verifica ora
              </button>
              <button
                onClick={handleSendCode}
                disabled={isLoading || sendSuccess}
                className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 transition-colors disabled:opacity-50"
              >
                {sendSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Inviato!
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  'Invia nuovo codice'
                )}
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ml-4 flex-shrink-0 text-yellow-400 hover:text-yellow-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal per inserire il codice */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Verifica Email</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setCode('')
                  setCodeError('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Inserisci il codice di 6 cifre ricevuto via email
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(value)
                    setCodeError('')
                  }}
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={isSubmitting}
                />
                {codeError && (
                  <p className="mt-1 text-sm text-red-600">{codeError}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Non hai ricevuto il codice? Controlla la cartella spam o clicca su "Invia nuovo codice".
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setCode('')
                    setCodeError('')
                  }}
                  className="flex-1 btn-outline"
                  disabled={isSubmitting}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifica...
                    </>
                  ) : (
                    'Verifica'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

