/**
 * Auth API Client - Axios Configuration
 * Client HTTP dedicato per il microservizio di autenticazione
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { config, API_URLS } from './config'
import type { ApiResponse } from '@/types'

class AuthApiClient {
  private instance: AxiosInstance
  private token: string | null = null
  private isRefreshing: boolean = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    const baseURL = API_URLS.auth
    
    this.instance = axios.create({
      baseURL, // Usa il microservizio Auth su AWS
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // Disabilita cookies per CORS
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request Interceptor - Aggiunge l'access_token a OGNI richiesta in uscita
    this.instance.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        // Carica il token da localStorage se non è in memoria
        if (!this.token) {
          this.token = localStorage.getItem(config.auth.tokenKey)
        }
        
        if (this.token && requestConfig.headers) {
          requestConfig.headers.Authorization = `Bearer ${this.token}`
        }
        return requestConfig
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response Interceptor - Gestisce il refresh automatico su 401
    // NOTA: Per le chiamate di autenticazione (/auth/login, /auth/register, etc.)
    // il 401 non dovrebbe triggerare il refresh, ma lo lasciamo per sicurezza
    this.instance.interceptors.response.use(
      (response) => response, // Se la risposta è 2xx, non fare nulla
      
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Se l'errore è 401 E non è una richiesta di "retry"
        // E NON è una richiesta di login/register/refresh (che non dovrebbero avere token)
        if (error.response?.status === 401 && 
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/auth/login') &&
            !originalRequest.url?.includes('/api/auth/register') &&
            !originalRequest.url?.includes('/api/auth/refresh')) {
          
          originalRequest._retry = true // Marca per evitare loop infiniti
          
          const refreshToken = localStorage.getItem(config.auth.refreshTokenKey)

          if (!refreshToken) {
            // Se non c'è refresh token, fai il logout forzato
            this.forceLogout()
            return Promise.reject(error)
          }

          // Se stiamo già refrescando, metti in coda la richiesta
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => {
              // Riprova la richiesta originale con il nuovo token
              if (this.token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${this.token}`
              }
              return this.instance(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          // Inizia il refresh
          this.isRefreshing = true

          try {
            // Tenta di rinfrescare il token usando il microservizio Auth
            const refreshResponse = await axios.post(
              `${API_URLS.auth}/api/auth/refresh`,
              { refresh_token: refreshToken },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                }
              }
            )

            // Successo! Salva i nuovi token
            const responseData = refreshResponse.data
            const accessToken = responseData.data?.access_token || responseData.access_token
            const newRefreshToken = responseData.data?.refresh_token || responseData.refresh_token

            if (accessToken && newRefreshToken) {
              this.token = accessToken
              localStorage.setItem(config.auth.tokenKey, accessToken)
              localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken)

              // Aggiorna l'header della richiesta originale
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
              }

              // Processa tutte le richieste in coda
              this.processQueue(null)

              // Riprova la richiesta originale
              return this.instance(originalRequest)
            } else {
              throw new Error('Invalid refresh response format')
            }

          } catch (refreshError) {
            // Refresh fallito! Logout forzato
            this.processQueue(refreshError)
            this.forceLogout()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // Per tutti gli altri errori, rigetta la promise
        return Promise.reject(error)
      }
    )
  }

  /**
   * Processa le richieste in coda dopo il refresh
   */
  private processQueue(error: any) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve()
      }
    })
    this.failedQueue = []
  }

  /**
   * Forza il logout eliminando i token e reindirizzando al login
   */
  private forceLogout() {
    this.clearToken()
    
    // Reindirizza al login se non ci sei già
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * Imposta i token (access + refresh) per le richieste successive
   */
  setToken(accessToken: string, refreshToken?: string) {
    this.token = accessToken
    localStorage.setItem(config.auth.tokenKey, accessToken)
    if (refreshToken) {
      localStorage.setItem(config.auth.refreshTokenKey, refreshToken)
    }
  }

  /**
   * Ottiene l'access token corrente
   */
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(config.auth.tokenKey)
    }
    return this.token
  }

  /**
   * Rimuove i token (logout)
   */
  clearToken() {
    this.token = null
    localStorage.removeItem(config.auth.tokenKey)
    localStorage.removeItem(config.auth.refreshTokenKey)
    localStorage.removeItem(config.auth.userKey)
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    // Normalizza l'URL per evitare slash doppi
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`
    
    const response = await this.instance.post<ApiResponse<T>>(normalizedUrl, data)
    return response.data
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params })
    return response.data
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data)
    return response.data
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data)
    return response.data
  }
}

// Esporta un'istanza singleton
export const authApi = new AuthApiClient()
export default authApi
