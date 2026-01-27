/**
 * Application Configuration
 * Gestisce tutte le variabili di ambiente e configurazioni globali
 * 
 * Supporta architettura ibrida:
 * - auth: Microservizio di autenticazione su AWS
 * - legacy: Vecchio server / altri microservizi non ancora migrati
 */

const isDevelopment = import.meta.env.DEV

/**
 * Normalizza un URL rimuovendo il trailing slash
 */
const normalizeURL = (url: string): string => {
  if (!url) return url
  return url.replace(/\/+$/, '')
}

/**
 * URL del microservizio di autenticazione (Python FastAPI su EC2)
 * Usa SOLO il nuovo servizio FastAPI, senza fallback al vecchio servizio
 */
const getAuthApiURL = (): string => {
  const envUrl = import.meta.env.VITE_AWS_AUTH_URL
  
  if (!envUrl) {
    throw new Error('VITE_AWS_AUTH_URL non è configurato. Configura la variabile d\'ambiente.')
  }
  
  return normalizeURL(envUrl)
}

/**
 * URL delle API legacy (vecchio server / altri microservizi)
 * Legge da VITE_LEGACY_API_URL, con fallback
 */
const getLegacyApiURL = (): string => {
  const envUrl = import.meta.env.VITE_LEGACY_API_URL
  
  const url = envUrl || (isDevelopment 
    ? '/api'
    : 'https://enter.takeyourtrade.com/api')
  
  return normalizeURL(url)
}

/**
 * URL del microservizio di ricerca (AWS Python FastAPI)
 * Legge da VITE_SEARCH_API_URL
 */
const getSearchApiURL = (): string => {
  const envUrl = import.meta.env.VITE_SEARCH_API_URL
  
  if (!envUrl) {
    throw new Error('VITE_SEARCH_API_URL non è configurato. Configura la variabile d\'ambiente.')
  }
  
  return normalizeURL(envUrl)
}

// URL delle API
const authApiURL = getAuthApiURL()
const legacyApiURL = getLegacyApiURL()
const searchApiURL = getSearchApiURL()

// Fallback URL per test di connettività
const fallbackURL = normalizeURL('https://enter.takeyourtrade.com/api')

/**
 * Oggetto centralizzato con tutti gli URL delle API
 * Distingue tra microservizio Auth (AWS), Search (AWS) e API legacy
 */
export const API_URLS = {
  auth: authApiURL,
  legacy: legacyApiURL,
  search: searchApiURL,
} as const

export const config = {
  api: {
    baseURL: legacyApiURL,
    fallbackURL: fallbackURL,
    timeout: 30000, // 30 secondi
  },
  auth: {
    baseURL: authApiURL,
    tokenKey: 'tyt_access_token',
    refreshTokenKey: 'tyt_refresh_token',
    userKey: 'tyt_user',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Take Your Trade',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  debug: {
    isDevelopment,
    showNetworkErrors: true,
  }
} as const

export default config

