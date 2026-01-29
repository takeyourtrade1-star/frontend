/**
 * Auth Store - Zustand
 * Gestione stato globale dell'autenticazione
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  VerifyEmailData, 
  ResendVerificationData, 
  PasswordResetRequest, 
  PasswordResetData,
  PasswordResetVerifyToken,
  EmailVerificationSend,
  EmailVerificationVerify,
  VerifyMFAData,
  MFALoginResponse
} from '@/types'
import { authApi } from '@/lib/authApi'
import { config } from '@/lib/config'

/** Default preferences when backend does not return them (backward compat) */
const DEFAULT_PREFERENCES: NonNullable<User['preferences']> = {
  theme: 'system',
  language: 'en',
  is_onboarding_completed: false,
}

/** Normalize user so preferences always has shape (backend may omit or use snake_case) */
function normalizeUser(user: User | null): User | null {
  if (!user) return null
  const prefs = user.preferences
  const preferences = {
    theme: (prefs?.theme ?? DEFAULT_PREFERENCES.theme) as 'light' | 'dark' | 'system',
    language: prefs?.language ?? DEFAULT_PREFERENCES.language,
    is_onboarding_completed: prefs?.is_onboarding_completed ?? DEFAULT_PREFERENCES.is_onboarding_completed,
  }
  return { ...user, preferences }
}

interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // MFA State
  preAuthToken: string | null
  mfaRequired: boolean

  // Actions
  login: (credentials: LoginCredentials) => Promise<{ mfaRequired: boolean; preAuthToken?: string }>
  verifyMFA: (data: VerifyMFAData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  verifyEmail: (data: VerifyEmailData) => Promise<void>
  resendVerification: (data: ResendVerificationData) => Promise<void>
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>
  verifyPasswordResetToken: (data: PasswordResetVerifyToken) => Promise<boolean>
  resetPassword: (data: PasswordResetData) => Promise<void>
  sendEmailVerification: (data?: EmailVerificationSend) => Promise<void>
  verifyEmailCode: (data: EmailVerificationVerify) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  updateUserPreferences: (preferences: Partial<NonNullable<User['preferences']>>) => void
  setToken: (accessToken: string, refreshToken?: string) => void
  clearError: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      preAuthToken: null,
      mfaRequired: false,

      // Initialize auth from localStorage and validate with backend
      initializeAuth: async () => {
        const accessToken = localStorage.getItem(config.auth.tokenKey)
        const refreshToken = localStorage.getItem(config.auth.refreshTokenKey)
        const userStr = localStorage.getItem(config.auth.userKey)
        
        // Se ci sono i token, validiamo la sessione chiamando /auth/me
        if (accessToken) {
          try {
            // Imposta il token per le richieste
            authApi.setToken(accessToken)
            
            // Valida la sessione chiamando /api/auth/me
            // L'interceptor gestirà automaticamente il refresh se il token è scaduto
            const response = await authApi.get('/api/auth/me') as any
            
            // Se la chiamata è andata a buon fine, aggiorna i dati utente
            const user = response.data?.user || response.user || (userStr ? JSON.parse(userStr) : null)
            
            if (user) {
              const normalized = normalizeUser(user)
              if (normalized) {
                localStorage.setItem(config.auth.userKey, JSON.stringify(normalized))
                set({
                  user: normalized,
                  accessToken: accessToken,
                  isAuthenticated: true,
                })
              } else {
                await get().logout()
              }
            } else {
              // Se non c'è user nella risposta, fai logout
              await get().logout()
            }
          } catch (error) {
            // Se la chiamata fallisce (e anche il refresh fallisce),
            // l'interceptor avrà già fatto il logout forzato
            
            // Se non c'è refresh token o la validazione è fallita, pulisci tutto
            if (!refreshToken) {
              await get().logout()
            }
            // Se c'è refresh token, l'interceptor ha gestito il refresh e il logout se necessario
          }
        } else {
          // Nessun token salvato, assicuriamoci che tutto sia pulito
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          })
        }
      },

      // Login
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, mfaRequired: false, preAuthToken: null })
        
        try {
          // Add honeypot field (required by backend)
          const payload = {
            ...credentials,
            website_url: '' // Honeypot field - must be empty string
          }
          
          const response = await authApi.post('/api/auth/login', payload) as any
          
          // Handle MFA response (Scenario 2)
          if (response.mfa_required === true && response.pre_auth_token) {
            set({
              preAuthToken: response.pre_auth_token,
              mfaRequired: true,
              isLoading: false,
              error: null,
            })
            return { mfaRequired: true, preAuthToken: response.pre_auth_token }
          }
          
          // Handle direct login response (Scenario 1)
          const responseData = response.data || response
          const accessToken = responseData.access_token || response.access_token
          const refreshToken = responseData.refresh_token || response.refresh_token
          const user = responseData.user || response.user
          
          if (accessToken && refreshToken) {
            // Salva entrambi i token e user
            authApi.setToken(accessToken, refreshToken)
            
            // If user is not in response, fetch it from /me endpoint
            let userToSet = user
            if (!userToSet) {
              try {
                const meResponse = await authApi.get('/api/auth/me') as any
                userToSet = meResponse.data?.user || meResponse.user || meResponse.data
              } catch (meError) {
                // If /me fails, still set authenticated but without user
              }
            }
            const normalized = userToSet ? normalizeUser(userToSet) : null
            if (normalized) {
              localStorage.setItem(config.auth.userKey, JSON.stringify(normalized))
            }
            set({
              user: normalized,
              accessToken: accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            return { mfaRequired: false }
          } else {
            throw new Error(response.message || responseData.message || 'Login fallito')
          }
        } catch (error: any) {
          // Supporta sia formato Laravel/Lumen che FastAPI
          let errorMessage = 'Errore durante il login'
          
          if (error.response?.data) {
            const errorData = error.response.data
            
            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              const firstDetail = errorData.detail[0]
              errorMessage = firstDetail.msg || firstDetail.message || errorMessage
            }
            // Laravel/Lumen format: { message: "..." }
            else if (errorData.message) {
              errorMessage = errorData.message
            }
          } else if (error.message) {
            errorMessage = error.message
          }
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            mfaRequired: false,
            preAuthToken: null,
          })
          
          throw error
        }
      },

      // Verify MFA
      verifyMFA: async (data: VerifyMFAData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/verify-mfa', data) as any
          
          const responseData = response.data || response
          const accessToken = responseData.access_token || response.access_token
          const refreshToken = responseData.refresh_token || response.refresh_token
          const user = responseData.user || response.user
          
          if (accessToken && refreshToken) {
            // Salva entrambi i token e user
            authApi.setToken(accessToken, refreshToken)
            
            let userToSet = user
            if (!userToSet) {
              try {
                const meResponse = await authApi.get('/api/auth/me') as any
                userToSet = meResponse.data?.user || meResponse.user || meResponse.data
              } catch (meError) {
                // If /me fails, still set authenticated but without user
              }
            }
            const normalized = userToSet ? normalizeUser(userToSet) : null
            if (normalized) {
              localStorage.setItem(config.auth.userKey, JSON.stringify(normalized))
            }
            set({
              user: normalized,
              accessToken: accessToken,
              isAuthenticated: true,
              mfaRequired: false,
              preAuthToken: null,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || responseData.message || 'Verifica MFA fallita')
          }
        } catch (error: any) {
          // Supporta sia formato Laravel/Lumen che FastAPI
          let errorMessage = 'Errore durante la verifica MFA'
          
          if (error.response?.data) {
            const errorData = error.response.data
            
            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              const firstDetail = errorData.detail[0]
              errorMessage = firstDetail.msg || firstDetail.message || errorMessage
            }
            // Laravel/Lumen format: { message: "..." }
            else if (errorData.message) {
              errorMessage = errorData.message
            }
          } else if (error.message) {
            errorMessage = error.message
          }
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          })
          
          throw error
        }
      },

      // Register
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          // Add honeypot field (required by backend)
          const payload = {
            ...data,
            website_url: '' // Honeypot field - must be empty string
          }
          
          // La chiamata API. Se fallisce (es. 400, 500), Axios lancerà un errore e andremo nel catch.
          // Se arriviamo alla riga successiva, è un successo (200 o 201).
          const response = await authApi.post('/api/auth/register', payload) as any
          
          // Estrae i dati dalla risposta (supporta sia response.data.data che response.data)
          const responseData = response.data || response
          const accessToken = responseData.access_token || responseData.data?.access_token
          const refreshToken = responseData.refresh_token || responseData.data?.refresh_token
          const user = responseData.user || responseData.data?.user
          
          // --- FIX: Rimuoviamo il controllo rigido su 'response.success' ---
          // Se siamo qui, la richiesta HTTP è andata a buon fine.
          
          if (accessToken && refreshToken && user) {
            const normalized = normalizeUser(user)
            if (normalized) {
              authApi.setToken(accessToken, refreshToken)
              localStorage.setItem(config.auth.userKey, JSON.stringify(normalized))
              set({
                user: normalized,
                accessToken: accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            } else {
              set({ isLoading: false, error: null })
            }
          } else {
            // Registrazione avvenuta ma senza auto-login (verifica email richiesta)
            set({
              isLoading: false,
              error: null,
            })
          }
          
        } catch (error: any) {
          console.error("Registration Error Detail:", error) // Debug log
          
          // Estrai messaggio errore più dettagliato
          // Supporta sia formato Laravel/Lumen che FastAPI
          let errorMessage = 'Errore durante la registrazione'
          
          if (error.response?.data) {
            const errorData = error.response.data
            
            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              // Prendi il primo errore dalla lista detail
              const firstDetail = errorData.detail[0]
              errorMessage = firstDetail.msg || firstDetail.message || errorMessage
              
              // Se ci sono più errori, possiamo concatenarli (opzionale)
              if (errorData.detail.length > 1) {
                const allMessages = errorData.detail
                  .map((d: any) => d.msg || d.message)
                  .filter((m: any) => m)
                  .join(', ')
                if (allMessages) {
                  errorMessage = allMessages
                }
              }
            }
            // Laravel/Lumen format: { message: "...", errors: { field: ["..."] } }
            else if (errorData.message) {
              errorMessage = errorData.message
            } else if (errorData.errors) {
              // Se ci sono errori di validazione, mostra il primo
              const firstError = Object.values(errorData.errors)[0]
              if (Array.isArray(firstError) && firstError.length > 0) {
                errorMessage = firstError[0] as string
              }
            }
          } else if (error.message) {
            errorMessage = error.message
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Verify Email
      verifyEmail: async (data: VerifyEmailData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post<{ user: User }>('/api/auth/verify-email', data)
          
          if (response.success && response.data) {
            set({
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Verifica email fallita')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante la verifica email'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Resend Verification
      resendVerification: async (data: ResendVerificationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/verify-email/resend', data)
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Invio email fallito')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante l\'invio email'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Request Password Reset
      requestPasswordReset: async (data: PasswordResetRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/password/request-reset', data)
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Richiesta reset fallita')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante la richiesta reset'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Verify Password Reset Token
      verifyPasswordResetToken: async (data: PasswordResetVerifyToken): Promise<boolean> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/password/verify-token', data) as any
          
          set({
            isLoading: false,
            error: null,
          })
          
          // La risposta ha success: true anche se il token non è valido (valid: false)
          return response.valid === true
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante la verifica token'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          return false
        }
      },

      // Reset Password
      resetPassword: async (data: PasswordResetData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/password/reset', {
            email: data.email,
            token: data.token,
            password: data.password,
            password_confirmation: data.password_confirmation
          }) as any
          
          // Controlla se ci sono errori di validazione nella risposta
          if (response.errors && Object.keys(response.errors).length > 0) {
            const errorMessages = Object.values(response.errors).flat().join(', ')
            const errorMessage = errorMessages || response.message || 'Errore durante il reset password'
            
            set({
              isLoading: false,
              error: errorMessage,
            })
            
            throw new Error(errorMessage)
          }
          
          // Controlla se la risposta indica successo
          if (response.success === false || (response.success === undefined && response.message)) {
            const errorMessage = response.message || 'Reset password fallito'
            
            set({
              isLoading: false,
              error: errorMessage,
            })
            
            throw new Error(errorMessage)
          }
          
          // Successo
          set({
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          // Gestisci errori di validazione Laravel/Lumen
          let errorMessage = 'Errore durante il reset password'
          
          if (error.response?.data) {
            const errorData = error.response.data
            
            // Se ci sono errori di validazione
            if (errorData.errors && typeof errorData.errors === 'object') {
              const validationErrors = Object.values(errorData.errors).flat()
              errorMessage = validationErrors.join(', ')
            } else if (errorData.message) {
              errorMessage = errorData.message
            }
          } else if (error.message) {
            errorMessage = error.message
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Send Email Verification Code
      sendEmailVerification: async (data?: EmailVerificationSend) => {
        set({ isLoading: true, error: null })
        
        try {
          // Se l'utente è autenticato, non serve passare email (viene presa dal token)
          const response = await authApi.post('/api/auth/email/send-verification', data || {})
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Invio codice verifica fallito')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante l\'invio codice verifica'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Verify Email Code
      verifyEmailCode: async (data: EmailVerificationVerify) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.post('/api/auth/email/verify', data) as any
          
          if (response.success && response.user) {
            // Aggiorna i dati utente con la nuova verifica
            const updatedUser = response.user || response.data?.user
            if (updatedUser) {
              localStorage.setItem(config.auth.userKey, JSON.stringify(updatedUser))
              set({
                user: updatedUser,
                isLoading: false,
                error: null,
              })
            } else {
              set({
                isLoading: false,
                error: null,
              })
            }
          } else {
            throw new Error(response.message || 'Verifica codice fallita')
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Errore durante la verifica codice'
          
          set({
            isLoading: false,
            error: errorMessage,
          })
          
          throw error
        }
      },

      // Logout
      logout: async () => {
        const accessToken = localStorage.getItem(config.auth.tokenKey)
        
        // Chiama l'endpoint di logout per invalidare la sessione sul server
        if (accessToken) {
          try {
            await authApi.post('/api/auth/logout', {})
          } catch (error) {
            // Anche se il logout fallisce, procediamo con la pulizia client-side
          }
        }
        
        // Pulisci i token e lo stato (anche se il logout API è fallito)
        authApi.clearToken()
        
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
        })
      },

      // Set user (normalize preferences)
      setUser: (user: User) => {
        const normalized = normalizeUser(user)
        if (normalized) {
          localStorage.setItem(config.auth.userKey, JSON.stringify(normalized))
          set({ user: normalized })
        }
      },

      // Aggiorna preferenze in memoria senza rifare login (evita loop visivo). Forziamo is_onboarding_completed: true localmente.
      updateUserPreferences: (prefs) => {
        set((state) => {
          if (!state.user) return state
          const updatedUser = {
            ...state.user,
            preferences: {
              ...(state.user.preferences || {}),
              ...prefs,
              is_onboarding_completed: true,
            },
          }
          try {
            localStorage.setItem(config.auth.userKey, JSON.stringify(updatedUser))
          } catch (_) {}
          return { user: updatedUser }
        })
      },

      // Set token
      setToken: (accessToken: string, refreshToken?: string) => {
        authApi.setToken(accessToken, refreshToken)
        set({ accessToken: accessToken, isAuthenticated: true })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

