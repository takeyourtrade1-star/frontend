/**
 * Search API Client - Axios Configuration
 * Client HTTP dedicato per il microservizio di ricerca Python su AWS
 * Utilizza esclusivamente gli endpoint del nuovo servizio Python FastAPI
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_URLS } from './config'
import type {
  AutocompleteResponse,
  SearchResultsResponse,
} from '@/config/searchApi'
import type {
  CardDetailResponse,
  CardPrintingsResponse,
  SetDetailResponse,
  SetListResponse,
} from '@/types'

class SearchApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: API_URLS.search,
      timeout: 30000, // 30 secondi
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // Disabilita cookies per CORS
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Response Interceptor - Gestisce errori comuni
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )
  }

  /**
   * Autocomplete - GET /api/search/autocomplete?term=...
   */
  async autocomplete(term: string): Promise<AutocompleteResponse> {
    const response = await this.instance.get<AutocompleteResponse>(
      '/api/search/autocomplete',
      {
        params: { term: term.trim() },
      }
    )
    return response.data
  }

  /**
   * Risultati Ricerca - GET /api/search/results?term=...&page=...
   * Supporta anche ricerca per IDs come fallback: ?ids=...&page=...
   */
  async searchResults(params: {
    term?: string
    ids?: string[] | string // Supporto per ricerca per IDs (fallback)
    page?: number
    sort?: string
    per_page?: number
  }): Promise<SearchResultsResponse> {
    // Se ci sono IDs ma non term, usa l'endpoint dedicato
    if (params.ids && !params.term) {
      return this.searchByOracleIdsPaginated({
        ids: params.ids,
        page: params.page,
        sort: params.sort,
        per_page: params.per_page,
      })
    }

    // Altrimenti usa la ricerca normale per term
    const response = await this.instance.get<SearchResultsResponse>(
      '/api/search/results',
      {
        params: {
          term: params.term?.trim(),
          // Se ci sono sia term che ids, passa anche ids come fallback
          ...(params.ids ? { ids: Array.isArray(params.ids) ? params.ids.join(',') : params.ids } : {}),
          page: params.page || 1,
          sort: params.sort || 'relevance',
          per_page: params.per_page || 20,
        },
      }
    )
    return response.data
  }

  /**
   * Dettaglio Carta (Oracle) - GET /api/card/{oracle_id}?printing_id=...
   */
  async getCardDetail(
    oracleId: string,
    printingId?: string | null
  ): Promise<CardDetailResponse> {
    const params = printingId ? { printing_id: printingId } : undefined
    const url = `/api/card/${encodeURIComponent(oracleId)}`
    
    const response = await this.instance.get<CardDetailResponse>(url, { params })
    return response.data
  }

  /**
   * Ristampe Carta - GET /api/card/{oracle_id}/printings
   */
  async getCardPrintings(oracleId: string): Promise<CardPrintingsResponse> {
    const response = await this.instance.get<CardPrintingsResponse>(
      `/api/card/${encodeURIComponent(oracleId)}/printings`
    )
    return response.data
  }

  /**
   * Dettaglio Set - GET /api/set/{set_code}
   */
  async getSetDetail(setCode: string): Promise<SetDetailResponse> {
    const response = await this.instance.get<SetDetailResponse>(
      `/api/set/${encodeURIComponent(setCode)}`
    )
    return response.data
  }

  /**
   * Lista Set - GET /api/sets
   */
  async getSets(): Promise<SetListResponse> {
    const response = await this.instance.get<SetListResponse>('/api/sets')
    return response.data
  }

  /**
   * Ricerca per Oracle IDs multipli (paginata) - GET /api/search/by-oracle-ids-paginated?ids=...&page=...&sort=...
   * Usato per autocomplete multilingua: cerca nei JSON locali, trova oracle_id, poi chiama questo endpoint
   */
  async searchByOracleIdsPaginated(params: {
    ids: string[] | string // Array di IDs o stringa separata da virgola
    page?: number
    sort?: string
    per_page?: number
  }): Promise<SearchResultsResponse> {
    // Converte array in stringa separata da virgola se necessario
    const idsString = Array.isArray(params.ids) 
      ? params.ids.join(',') 
      : params.ids

    const response = await this.instance.get<SearchResultsResponse>(
      '/api/search/by-oracle-ids-paginated',
      {
        params: {
          ids: idsString,
          page: params.page || 1,
          sort: params.sort || 'relevance',
          per_page: params.per_page || 20,
        },
      }
    )
    return response.data
  }
}

// Esporta un'istanza singleton
export const searchApi = new SearchApiClient()
export default searchApi

