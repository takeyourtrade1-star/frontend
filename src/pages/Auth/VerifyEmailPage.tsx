/**
 * VerifyEmailPage
 * Pagina di verifica email dopo la registrazione
 */

import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')
  const { resendVerification } = useAuthStore()
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResending(true)
    try {
      await resendVerification({ email })
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (error) {
      navigate('/error?type=verify')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verifica la tua email
          </h1>
          <p className="text-gray-600">
            Ti abbiamo inviato un link di verifica
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center space-y-6">
            <div>
              <p className="text-gray-700 mb-2">
                Abbiamo inviato un'email di verifica a:
              </p>
              <p className="font-mono text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                {email || 'la tua email'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Cosa fare ora?</p>
                  <ol className="list-decimal list-inside space-y-1 text-left">
                    <li>Controlla la tua casella di posta</li>
                    <li>Cerca l'email da Take Your Trade</li>
                    <li>Clicca sul link di verifica</li>
                    <li>Torna qui per effettuare il login</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleResendEmail}
                disabled={isResending || resendSuccess}
                className="w-full flex items-center justify-center space-x-2 text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Invio in corso...</span>
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Email inviata!</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Non hai ricevuto l'email? Invia di nuovo</span>
                  </>
                )}
              </button>

              <div className="border-t border-gray-200 pt-4">
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
      </div>
    </div>
  )
}
