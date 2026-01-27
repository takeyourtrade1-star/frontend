/**
 * RegisterPage
 * Pagina di registrazione con wizard a 5 step
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegisterStore, validateStep } from '@/store/registerStore'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/authApi'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

// Import step components
import ProgressBar from '@/components/register/ProgressBar'
import StepCountry from '@/components/register/StepCountry'
import StepAccount from '@/components/register/StepAccount'
import StepIdentity from '@/components/register/StepIdentity'
import StepContacts from '@/components/register/StepContacts'
import StepCredentials from '@/components/register/StepCredentials'
import ErrorMessage from '@/components/register/ErrorMessage'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, clearError } = useAuthStore()
  const {
    step,
    country,
    phone_prefix,
    account_type,
    nome,
    cognome,
    ragione_sociale,
    piva,
    phone,
    email,
    username,
    password,
    password_confirmation,
    // termsAccepted,
    // privacyAccepted,
    // cancellationAccepted,
    // adultConfirmed,
    next,
    prev,
    reset,
    // setLoading,
    clearAllErrors,
    setError,
    errors
  } = useRegisterStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Debug states
  const [showDebug, setShowDebug] = useState(true) // Mostra sempre il debug
  const [debugResults, setDebugResults] = useState<any[]>([])
  const [isDebugging, setIsDebugging] = useState(false)

  // Check if current step is valid
  const isCurrentStepValid = validateStep(step, useRegisterStore.getState())

  // Test automatico all'avvio
  useEffect(() => {
    const runInitialTests = async () => {
      await testApiConnection()
    }
    
    runInitialTests()
  }, [])

  // Handle step navigation
  const handleNext = () => {
    if (isCurrentStepValid && step < 5) {
      next()
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      prev()
    }
  }

  // Handle final submission
  const handleSubmit = async () => {
    if (!isCurrentStepValid) return

    setIsSubmitting(true)
    clearAllErrors()
    clearError()

    // Assicurati che i dati siano salvati nello store prima di procedere
    // Questo è importante per nome e cognome che potrebbero non essere stati salvati
    const storeState = useRegisterStore.getState()
    
    // Prepare registration data
    // IMPORTANTE: I campi devono corrispondere alla documentazione AWS
    // La documentazione accetta varianti: nome/firstName per first_name, cognome/lastName per last_name
    const registerData: any = {
      account_type: (account_type === 'business' ? 'private' : account_type!) as 'personal' | 'private', // AWS usa 'private' invece di 'business'
      country,
      phone_prefix,
      phone: phone!, // AWS si aspetta 'phone' non 'telefono'
      email: email!,
      username: username!,
      password: password!,
      password_confirmation: password_confirmation!,
      // Add personal or business fields based on account type
      // La documentazione AWS accetta anche varianti: nome/firstName per first_name
      ...(account_type === 'personal' 
        ? { 
            first_name: storeState.nome || nome || '', // Usa first_name per AWS
            last_name: storeState.cognome || cognome || '' // Usa last_name per AWS
          }
        : { 
            // Per account business/private, invia anche i dati aziendali se disponibili
            // Nota: AWS potrebbe non supportare questi campi, ma li inviamo comunque
            ragione_sociale: storeState.ragione_sociale || ragione_sociale || '', 
            piva: storeState.piva || piva || '' 
          }
      )
    }

    try {
      // Call registration using authStore
      await register(registerData)

      // Aggiungi risultato positivo ai debug results
      const successResult = {
        description: 'Registrazione completata con successo',
        status: 'success',
        duration: 0,
        data: registerData,
        timestamp: new Date().toISOString()
      }
      setDebugResults(prev => [...prev, successResult])

      // Show success modal
      setShowSuccessModal(true)
      
      // Reset form after delay
      setTimeout(() => {
        reset()
        navigate('/success?type=register')
      }, 3000)
    } catch (error: any) {
      // Aggiungi dettagli dell'errore ai risultati debug con informazioni complete
      const errorResult = {
        description: 'Registrazione fallita',
        status: 'error',
        duration: 0,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        data: registerData,
        requestUrl: error.config?.url || error.request?.responseURL,
        requestMethod: error.config?.method || 'POST',
        requestHeaders: error.config?.headers,
        responseHeaders: error.response?.headers,
        timestamp: new Date().toISOString(),
        fullError: {
          message: error.message,
          name: error.name,
          code: error.code,
          stack: error.stack,
          response: error.response?.data,
          request: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers
          }
        }
      }
      
      setDebugResults(prev => [...prev, errorResult])
      
      // Handle different error types
      if (error.response?.status === 422) {
        // Validation errors - map to form fields
        const errors = error.response.data.errors || {}
        Object.keys(errors).forEach(field => {
          setError(field, errors[field][0])
        })
      } else if (error.response?.status === 429) {
        // Rate limit
        setError('general', 'Troppi tentativi, riprova più tardi')
      } else {
        // Generic error
        setError('general', error.message || 'Errore durante la registrazione')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funzioni di debug
  const testApiConnection = async () => {
    const startTime = Date.now()
    try {
      const response = await authApi.get('/api/health')
      const duration = Date.now() - startTime
      
      const result = {
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

  const testRegistration = async (testData: any, description: string) => {
    const startTime = Date.now()
    // Rimuovi il campo 'description' dai dati prima di inviarli (non fa parte della documentazione AWS)
    const { description: _, ...dataToSend } = testData
    
    // Add honeypot field (required by backend)
    const payload = {
      ...dataToSend,
      website_url: '' // Honeypot field - must be empty string
    }
    
    try {
      const response = await authApi.post('/api/auth/register', payload)
      
      const duration = Date.now() - startTime
      const result = {
        description,
        status: 'success',
        duration,
        response: response,
        data: dataToSend, // Mostra i dati effettivamente inviati (senza description)
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result = {
        description,
        status: 'error',
        duration,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        requestUrl: error.config?.url || error.request?.responseURL,
        data: dataToSend, // Mostra i dati effettivamente inviati (senza description)
        fullError: {
          message: error.message,
          response: error.response?.data,
          request: error.config
        },
        timestamp: new Date().toISOString()
      }
      
      setDebugResults(prev => [...prev, result])
      return result
    }
  }

  const runDebugTests = async () => {
    setIsDebugging(true)
    setDebugResults([])

    const storeState = useRegisterStore.getState()
    
    // Test con dati attuali del form
    const currentData: any = {
      account_type: (storeState.account_type === 'business' ? 'private' : storeState.account_type!) as 'personal' | 'private',
      country: storeState.country || 'IT',
      phone_prefix: storeState.phone_prefix || '+39',
      phone: storeState.phone || '123456789',
      email: storeState.email || `test-${Date.now()}@example.com`,
      username: storeState.username || `testuser${Date.now()}`,
      password: 'password123',
      password_confirmation: 'password123',
      ...(storeState.account_type === 'personal' 
        ? { 
            first_name: storeState.nome || 'Test',
            last_name: storeState.cognome || 'User'
          }
        : { 
            ragione_sociale: storeState.ragione_sociale || 'Test Company',
            piva: storeState.piva || '12345678901'
          }
      )
    }

    const testCases = [
      { ...currentData, description: 'Test con dati attuali del form' },
      { 
        ...currentData, 
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        description: 'Test con email/username unici' 
      },
      {
        account_type: 'personal',
        country: 'IT',
        phone_prefix: '+39',
        phone: '123456789',
        email: `personal-${Date.now()}@example.com`,
        username: `personal${Date.now()}`,
        password: 'password123',
        password_confirmation: 'password123',
        first_name: 'Mario',
        last_name: 'Rossi',
        description: 'Test account personale completo'
      },
      {
        account_type: 'private',
        country: 'IT',
        phone_prefix: '+39',
        phone: '123456789',
        email: `business-${Date.now()}@example.com`,
        username: `business${Date.now()}`,
        password: 'password123',
        password_confirmation: 'password123',
        ragione_sociale: 'Azienda Test SRL',
        piva: '12345678901',
        description: 'Test account business/private completo'
      }
    ]

    for (const testCase of testCases) {
      const { description, ...testData } = testCase
      await testRegistration(testData, description)
      // Piccola pausa tra i test
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsDebugging(false)
  }

  const clearDebugResults = () => {
    setDebugResults([])
  }

  const testCurrentFormData = async () => {
    const storeState = useRegisterStore.getState()
    const testData: any = {
      account_type: (storeState.account_type === 'business' ? 'private' : storeState.account_type!) as 'personal' | 'private',
      country: storeState.country || 'IT',
      phone_prefix: storeState.phone_prefix || '+39',
      phone: storeState.phone || '123456789',
      email: storeState.email || `test-${Date.now()}@example.com`,
      username: storeState.username || `testuser${Date.now()}`,
      password: storeState.password || 'password123',
      password_confirmation: storeState.password_confirmation || 'password123',
      ...(storeState.account_type === 'personal' 
        ? { 
            first_name: storeState.nome || 'Test',
            last_name: storeState.cognome || 'User'
          }
        : { 
            ragione_sociale: storeState.ragione_sociale || 'Test Company',
            piva: storeState.piva || '12345678901'
          }
      )
    }
    
    // Non includere 'description' nei dati inviati
    await testRegistration(testData, 'Test con dati attuali del form')
  }

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <StepCountry />
      case 2:
        return <StepAccount />
      case 3:
        return <StepIdentity />
      case 4:
        return <StepContacts />
      case 5:
        return <StepCredentials />
      default:
        return <StepCountry />
    }
  }

  // Get step titles for navigation
  const getStepTitle = (stepNumber: number) => {
    const titles = {
      1: 'Paese',
      2: 'Account',
      3: 'Dati',
      4: 'Contatti',
      5: 'Credenziali'
    }
    return titles[stepNumber as keyof typeof titles] || ''
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-gray-900 hover:text-orange-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Torna alla home</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Registrazione</h1>
              <p className="text-sm text-gray-600">Step {step} di 5 - {getStepTitle(step)}</p>
            </div>
            
            <Link to="/login" className="text-gray-600 hover:text-orange-600 transition-colors">
              <X className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Step Content */}
          <div className="p-8">
            {/* General Error Message */}
            {errors.general && errors.general.length > 0 && (
              <div className="mb-6">
                <ErrorMessage 
                  message={errors.general[0]} 
                  onClose={() => clearAllErrors()}
                />
              </div>
            )}
            
            {renderCurrentStep()}
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${step === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Indietro
              </button>

              {/* Step Indicator */}
              <div className="text-sm text-gray-500">
                {step} di 5
              </div>

              {/* Next/Submit Button */}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all duration-200
                    ${isCurrentStepValid
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Prosegui
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isCurrentStepValid || isSubmitting}
                  className={`
                    px-8 py-3 rounded-xl font-medium transition-all duration-200
                    ${isCurrentStepValid && !isSubmitting
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline mr-2"></div>
                      Registrazione...
                    </>
                  ) : (
                    'Completa Registrazione'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Registrazione completata!
            </h3>
            <p className="text-gray-600 mb-6">
              Ti abbiamo inviato un'email di verifica. Controlla la tua casella di posta e clicca sul link per attivare il tuo account.
            </p>
            <div className="text-sm text-gray-500">
              Reindirizzamento in corso...
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">🔧 Debug Registrazione</h3>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-600">
                Server: {window.location.hostname}
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
                  onClick={testCurrentFormData}
                  disabled={isDebugging || step < 5}
                  className="px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  🧪 Test Dati Form
                </button>
                
                <button
                  onClick={runDebugTests}
                  disabled={isDebugging}
                  className="px-3 py-2 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  {isDebugging ? 'Testing...' : '🧪 Test Completi'}
                </button>
                
                <button
                  onClick={clearDebugResults}
                  className="px-3 py-2 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600"
                >
                  🗑️ Pulisci
                </button>
              </div>

              {/* Current Form Data Preview */}
              {step >= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-yellow-800 mb-2">
                    <strong>Dati Form Attuali:</strong>
                  </p>
                  <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify({
                      account_type: account_type === 'business' ? 'private' : account_type,
                      country,
                      phone_prefix,
                      phone,
                      email,
                      username,
                      password: password ? '***' : '',
                      password_confirmation: password_confirmation ? '***' : '',
                      ...(account_type === 'personal' 
                        ? { first_name: nome, last_name: cognome }
                        : { ragione_sociale, piva }
                      )
                    }, null, 2)}
                  </pre>
                  
                  {/* Suggerimenti per errore 500 */}
                  {debugResults.some(r => r.statusCode === 500) && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <p className="text-xs text-red-800 font-medium mb-1">
                        ⚠️ Errore 500 rilevato - Possibili cause:
                      </p>
                      <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                        <li>Email o username già esistenti (dovrebbe dare 422, ma potrebbe dare 500)</li>
                        <li>Formato telefono non valido (prova senza prefisso o solo numeri)</li>
                        <li>Caratteri speciali nel nome/cognome</li>
                        <li>Problema backend (database, configurazione email, ecc.)</li>
                      </ul>
                      <p className="text-xs text-red-700 mt-2">
                        <strong>Suggerimento:</strong> Controlla i log del backend per dettagli specifici.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Debug Results */}
              {debugResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
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
                          {result.duration && <span className="text-gray-500">{result.duration}ms</span>}
                          {result.statusCode && <span className="text-gray-500">HTTP {result.statusCode}</span>}
                        </div>
                      </div>
                      
                      {result.status === 'success' ? (
                        <div className="text-green-600 mt-2">
                          <strong>Risposta:</strong>
                          <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto text-xs">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-red-600 mt-2 space-y-2">
                          <div>
                            <strong>Errore:</strong>
                            <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto text-xs">
                              {JSON.stringify(result.error, null, 2)}
                            </pre>
                          </div>
                          {result.requestUrl && (
                            <div className="text-xs">
                              <strong>URL:</strong> {result.requestUrl}
                            </div>
                          )}
                          {result.fullError && (
                            <details className="text-xs">
                              <summary className="cursor-pointer font-medium">Dettagli completi errore</summary>
                              <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto text-xs">
                                {JSON.stringify(result.fullError, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                      
                      {result.data && (
                        <div className="text-gray-600 mt-2">
                          <strong>Dati inviati:</strong>
                          <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto text-xs">
                            {JSON.stringify({
                              ...result.data,
                              password: result.data.password ? '***' : '',
                              password_confirmation: result.data.password_confirmation ? '***' : ''
                            }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

