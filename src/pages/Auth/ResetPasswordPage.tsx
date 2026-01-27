/**
 * ResetPasswordPage
 * Pagina per il reset della password
 * Integrazione con backend Lumen
 */

import { useState, FormEvent, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword, verifyPasswordResetToken, isLoading, error, clearError } = useAuthStore()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [isVerifyingToken, setIsVerifyingToken] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isResetSuccess, setIsResetSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    password?: string
    passwordConfirmation?: string
  }>({})

  // Verifica il token quando la pagina viene caricata
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setIsVerifyingToken(false)
        setIsTokenValid(false)
        return
      }

      try {
        const valid = await verifyPasswordResetToken({ email, token })
        setIsTokenValid(valid)
      } catch (error) {
        setIsTokenValid(false)
      } finally {
        setIsVerifyingToken(false)
      }
    }

    verifyToken()
  }, [token, email, verifyPasswordResetToken])

  // Validazione password
  const validatePassword = (value: string): string | undefined => {
    if (value.length < 8) {
      return 'La password deve essere di almeno 8 caratteri'
    }
    return undefined
  }

  // Validazione conferma password
  const validatePasswordConfirmation = (value: string): string | undefined => {
    if (value !== password) {
      return 'Le password non coincidono'
    }
    return undefined
  }

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setValidationErrors(prev => ({
      ...prev,
      password: validatePassword(value)
    }))
  }

  // Handle password confirmation change
  const handlePasswordConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPasswordConfirmation(value)
    setValidationErrors(prev => ({
      ...prev,
      passwordConfirmation: validatePasswordConfirmation(value)
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationErrors({})

    if (!token || !email) {
      return
    }

    // Validazione lato client
    const passwordError = validatePassword(password)
    const passwordConfirmationError = validatePasswordConfirmation(passwordConfirmation)

    if (passwordError || passwordConfirmationError) {
      setValidationErrors({
        password: passwordError,
        passwordConfirmation: passwordConfirmationError
      })
      return
    }

    try {
      await resetPassword({
        email: email!,
        password,
        password_confirmation: passwordConfirmation,
        token: token!
      })
      
      // Controlla se ci sono errori nello store dopo la chiamata
      // Usa un piccolo delay per assicurarsi che lo store sia aggiornato
      setTimeout(() => {
        const storeError = useAuthStore.getState().error
        
        if (storeError) {
          // Non mostrare successo se c'è un errore
          return
        }
        
        setIsResetSuccess(true)
        
        // Redirect dopo 3 secondi
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }, 100)
      
    } catch (error: any) {
      // L'errore è già gestito nello store
    }
  }

  // Mostra loading durante verifica token
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-[#FFA500] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica in corso...</h1>
          <p className="text-gray-600">
            Stiamo verificando il link di reset password
          </p>
        </div>
      </div>
    )
  }

  // Se non ci sono token/email o se il token non è valido
  if (!token || !email || !isTokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Token non valido o scaduto</h1>
            <p className="text-gray-600 mb-2">
              Il link di reset password non è valido o è scaduto.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Richiedi un nuovo link dalla pagina password dimenticata.
            </p>
            <div className="space-y-3">
              <Link 
                to="/forgot-password" 
                className="inline-block w-full btn-primary text-center"
                style={{ backgroundColor: '#FFA500' }}
              >
                Richiedi Nuovo Reset
              </Link>
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

  // Successo reset password
  if (isResetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password reimpostata con successo</h1>
            <p className="text-gray-600 mb-2">
              La tua password è stata aggiornata correttamente.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Reindirizzamento al login in corso...
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center space-x-2 text-[#FFA500] hover:text-[#FF8C00] font-medium transition-colors"
            >
              <span>Vai al login ora</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-md w-full">
        {/* Card Reset */}
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reset Password</h1>
          <p className="text-gray-600 mb-6 text-center">Inserisci la tua nuova password</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuova Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`input-field pr-10 ${validationErrors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Inserisci la nuova password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
                {!validationErrors.password && password.length > 0 && password.length < 8 && (
                  <p className="mt-1 text-sm text-gray-500">Minimo 8 caratteri richiesti</p>
                )}
              </div>

              {/* Password Confirmation */}
              <div>
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  Conferma Password
                </label>
                <div className="relative">
                  <input
                    id="passwordConfirmation"
                    type={showPasswordConfirmation ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={handlePasswordConfirmationChange}
                    className={`input-field pr-10 ${validationErrors.passwordConfirmation ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Conferma la nuova password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {validationErrors.passwordConfirmation && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.passwordConfirmation}</p>
                )}
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
                disabled={
                  isLoading || 
                  password.length < 8 || 
                  password !== passwordConfirmation || 
                  !password || 
                  !passwordConfirmation
                }
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: isLoading || password.length < 8 || password !== passwordConfirmation || !password || !passwordConfirmation ? '#ccc' : '#FFA500' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Aggiornando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Aggiorna Password
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
