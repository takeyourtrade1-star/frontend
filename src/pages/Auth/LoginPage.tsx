/**
 * LoginPage
 * Pagina di login con autenticazione JWT
 */

import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/authApi'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, user, isAuthenticated } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showDebug, setShowDebug] = useState(true) // Mostra sempre il debug
  const [debugResults, setDebugResults] = useState<any[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  // Test automatico all'avvio
  useEffect(() => {
    const runInitialTests = async () => {
      await testApiConnection()
      await testAccount('test-debug@example.com', 'password123', 'Test automatico - account funzionante')
    }
    
    runInitialTests()
  }, [isAuthenticated, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      const result = await login({ email, password })
      
      // Check if MFA is required
      if (result?.mfaRequired && result?.preAuthToken) {
        // Redirect to MFA verification page
        navigate('/verify-mfa', { 
          state: { 
            preAuthToken: result.preAuthToken,
            email: email,
            from: (location.state as any)?.from || '/dashboard'
          },
          replace: true 
        })
        return
      }
      
      // Direct login successful - redirect
      const from = (location.state as any)?.from || window.location.pathname
      // Se viene da /login o è la home, vai alla dashboard, altrimenti rimani dove sei
      if (from === '/login' || from === '/') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (error: any) {
      // Aggiungi dettagli dell'errore ai risultati debug
      const errorResult = {
        email: email,
        password: password,
        description: 'Login fallito - credenziali inserite',
        status: 'error',
        duration: 0,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString(),
        fullError: error
      }
      
      setDebugResults(prev => [...prev, errorResult])
    }
  }

  // Funzioni di debug
  const testAccount = async (testEmail: string, testPassword: string, description: string) => {
    const startTime = Date.now()
    try {
      const response = await authApi.post('/api/auth/login', {
        email: testEmail,
        password: testPassword,
        website_url: '' // Honeypot field
      })
      
      const duration = Date.now() - startTime
      const result = {
        email: testEmail,
        password: testPassword,
        description,
        status: 'success',
        duration,
        response: response,
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result = {
        email: testEmail,
        password: testPassword,
        description,
        status: 'error',
        duration,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
      return result
    }
  }

  const runDebugTests = async () => {
    setIsDebugging(true)
    setDebugResults([])

    const testAccounts = [
      { email: 'test-debug@example.com', password: 'password123', description: 'Account di test funzionante' },
      { email: 'jrovera05@gmail.com', password: 'password123', description: 'Account database - password123' },
      { email: 'jrovera05@gmail.com', password: '123456', description: 'Account database - 123456' },
      { email: 'jrovera05@gmail.com', password: 'jrovera05', description: 'Account database - username' },
      { email: 'jrovera05@gmail.com', password: 'admin', description: 'Account database - admin' },
      { email: 'utente111999@gmail.com', password: 'password123', description: 'Account verificato - password123' },
      { email: 'utente111999@gmail.com', password: '123456', description: 'Account verificato - 123456' },
      { email: email, password: password, description: 'Credenziali inserite dall\'utente' }
    ]

    for (const account of testAccounts) {
      await testAccount(account.email, account.password, account.description)
    }

    setIsDebugging(false)
  }

  const clearDebugResults = () => {
    setDebugResults([])
  }

  const testApiConnection = async () => {
    const startTime = Date.now()
    try {
      const response = await authApi.get('/api/health')
      const duration = Date.now() - startTime
      
      const result = {
        email: 'API Health Check',
        password: 'N/A',
        description: 'Test connessione API',
        status: 'success',
        duration,
        response: response,
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result = {
        email: 'API Health Check',
        password: 'N/A',
        description: 'Test connessione API',
        status: 'error',
        duration,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full">
        {/* Auth Status */}
        {isAuthenticated && user && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800">
                <strong>Già autenticato come:</strong> {user.username} ({user.email})
              </span>
            </div>
            <div className="mt-2 text-xs text-green-700">
              Vuoi effettuare il logout e accedere con un altro account?
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-orange-500 text-white font-bold text-3xl px-6 py-3 rounded-2xl mb-4">
            TYT
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Benvenuto</h1>
          <p className="text-gray-600 mt-2">Accedi al tuo account</p>
        </div>

        {/* Card Login */}
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Accesso in corso...</span>
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3">
            <Link
              to="/forgot-password"
              className="block text-center text-sm text-orange-500 hover:text-orange-600 transition-colors"
            >
              Password dimenticata?
            </Link>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-center text-sm text-gray-600">
                Non hai un account?{' '}
                <Link
                  to="/register"
                  className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Registrati
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">🔧 Debug Login</h3>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">
                Server: {window.location.hostname}:3000
              </div>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {showDebug ? 'Nascondi Debug' : 'Mostra Debug'}
              </button>
            </div>
          </div>

          {showDebug && (
            <div className="space-y-4">
              {/* Debug Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testApiConnection}
                  className="px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
                >
                  🌐 Test API
                </button>
                
                <button
                  onClick={runDebugTests}
                  disabled={isDebugging}
                  className="px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isDebugging ? 'Testing...' : '🧪 Test Tutti Account'}
                </button>
                
                <button
                  onClick={clearDebugResults}
                  className="px-3 py-2 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600"
                >
                  🗑️ Pulisci
                </button>
              </div>

              {/* Debug Results */}
              {debugResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {debugResults.map((result, index) => (
                    <div key={index} className="bg-white border rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{result.description}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status === 'success' ? '✅' : '❌'} {result.status.toUpperCase()}
                          </span>
                          <span className="text-gray-500">{result.duration}ms</span>
                        </div>
                      </div>
                      
                      <div className="text-gray-600 mb-1">
                        <strong>Email:</strong> {result.email} | <strong>Password:</strong> {result.password}
                      </div>
                      
                      {result.status === 'success' ? (
                        <div className="text-green-600">
                          <strong>Risposta:</strong> {JSON.stringify(result.response, null, 2)}
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <strong>Errore:</strong> {JSON.stringify(result.error, null, 2)}
                          {result.statusCode && (
                            <div className="mt-1">
                              <strong>Status Code:</strong> {result.statusCode}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Current Credentials Test */}
              {email && password && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Test Credenziali Correnti:</strong> {email} / {password}
                  </p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => testAccount(email, password, 'Credenziali correnti')}
                      className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                    >
                      Test Solo Queste Credenziali
                    </button>
                    <button
                      onClick={() => {
                        login({ email, password }).catch(error => {
                          const errorResult = {
                            email: email,
                            password: password,
                            description: 'Test authStore.login',
                            status: 'error',
                            duration: 0,
                            error: error.response?.data || error.message,
                            statusCode: error.response?.status,
                            timestamp: new Date().toISOString(),
                            fullError: error
                          }
                          setDebugResults(prev => [...prev, errorResult])
                        })
                      }}
                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      Test con authStore.login
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-800 text-center">
            <strong>Per testing:</strong> usa credenziali del backend Laravel esistente
          </p>
        </div>
      </div>
    </div>
  )
}

