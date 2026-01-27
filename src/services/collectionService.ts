/**
 * Collection Service
 * API client per il microservizio di gestione collezione
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { CollectionItem, CollectionFilters, ApiResponse } from '@/types'
import { config, API_URLS } from '@/lib/config'

class CollectionApiClient {
  private instance: AxiosInstance
  private isRefreshing: boolean = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    this.instance = axios.create({
      baseURL: 'https://collection.takeyourtrade.com/api/v1',
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request Interceptor - Aggiunge l'access_token a OGNI richiesta in uscita
    this.instance.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(config.auth.tokenKey)
        if (token && requestConfig.headers) {
          requestConfig.headers.Authorization = `Bearer ${token}`
        }
        return requestConfig
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response Interceptor - Gestisce il refresh automatico su 401
    this.instance.interceptors.response.use(
      (response) => response, // Se la risposta è 2xx, non fare nulla
      
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Se l'errore è 401 E non è una richiesta di "retry"
        if (error.response?.status === 401 && !originalRequest._retry) {
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
              const token = localStorage.getItem(config.auth.tokenKey)
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.instance(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          // Inizia il refresh
          this.isRefreshing = true

          try {
            // Tenta di rinfrescare il token usando il microservizio Auth su AWS
            const refreshResponse = await axios.post(
              `${API_URLS.auth}/auth/refresh`,
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
    localStorage.removeItem(config.auth.tokenKey)
    localStorage.removeItem(config.auth.refreshTokenKey)
    localStorage.removeItem(config.auth.userKey)
    
    // Reindirizza al login se non ci sei già
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * GET request
   */
  private async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params })
    return response.data
  }

  /**
   * POST request
   */
  private async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data)
    return response.data
  }

  /**
   * PATCH request
   */
  private async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data)
    return response.data
  }

  /**
   * DELETE request
   */
  private async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url)
    return response.data
  }

  /**
   * Fetch collection items with filters and pagination
   */
  async fetchCollectionItems(
    page: number = 1,
    perPage: number = 50,
    filters?: CollectionFilters
  ): Promise<ApiResponse<{ items: CollectionItem[]; total: number; page: number; per_page: number; total_pages: number }>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    }

    // Add filter parameters
    if (filters) {
      if (filters.condition && filters.condition.length > 0) {
        params.condition = filters.condition.join(',')
      }
      if (filters.language && filters.language.length > 0) {
        params.language = filters.language.join(',')
      }
      if (filters.is_foil !== null && filters.is_foil !== undefined) {
        params.is_foil = filters.is_foil
      }
      if (filters.source && filters.source.length > 0) {
        params.source = filters.source.join(',')
      }
      if (filters.search) {
        params.search = filters.search
      }
    }

    return this.get('/collections/items/', params)
  }

  /**
   * Get a single collection item by ID
   */
  async getCollectionItem(itemId: string): Promise<ApiResponse<CollectionItem>> {
    return this.get(`/collections/items/${itemId}`)
  }

  /**
   * Create a new collection item
   */
  async createCollectionItem(data: Partial<CollectionItem>): Promise<ApiResponse<CollectionItem>> {
    return this.post('/collections/items/', data)
  }

  /**
   * Update an existing collection item
   */
  async updateCollectionItem(itemId: string, data: Partial<CollectionItem>): Promise<ApiResponse<CollectionItem>> {
    return this.patch(`/collections/items/${itemId}`, data)
  }

  /**
   * Delete a collection item
   */
  async deleteCollectionItem(itemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/collections/items/${itemId}`)
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return this.instance.get('/health')
  }
}

export const collectionService = new CollectionApiClient()
export default collectionService

