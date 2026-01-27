/**
 * useHybridAutocomplete Hook
 * Hook per ricerca multilingua ibrida con Fuse.js e API fallback
 * Aggiornato per la nuova struttura JSON: array di oggetti {id, name, preferred}
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { AxiosError } from 'axios'
import { searchApi } from '@/lib/searchApi'
import type { AutocompleteResponse, Printing, Card, Set, AutocompleteResult } from '@/config/searchApi'
import { useLanguage } from '@/contexts/LanguageContext'

interface UseHybridAutocompleteOptions {
  debounceMs?: number
  minLength?: number
}

// Estendiamo Printing per includere il nome originale inglese come fallback
export interface PrintingWithTranslation extends Printing {
  originalName?: string // Nome inglese originale (per fallback)
  preferredName?: string // Nome tradotto (prioritario)
  type?: 'card' // Tipo per distinguere le carte
  image_uri_normal?: string | null // Immagine classica per preview
}

// Tipo per risultati misti (carte e set)
export type AutocompleteResultWithTranslation = PrintingWithTranslation | (Set & { type: 'set' })

interface UseHybridAutocompleteResult {
  results: AutocompleteResultWithTranslation[]
  loading: boolean
  error: string | null
  cached: boolean
  translatedName: string | null // Nome tradotto trovato (es. "mare sotterraneo")
}

export function useHybridAutocomplete(
  term: string,
  options: UseHybridAutocompleteOptions = {}
): UseHybridAutocompleteResult {
  const {
    debounceMs = 300,
    minLength = 2,
  } = options

  const { selectedLang, fuseDictionary, idToPreferredName, isLangLoading } = useLanguage()

  const [results, setResults] = useState<AutocompleteResultWithTranslation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  const [translatedName, setTranslatedName] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rateLimitRef = useRef<{ blocked: boolean; until: number }>({ blocked: false, until: 0 })

  // Funzione per chiamare API standard inglese
  const fetchEnglishAutocomplete = useCallback(async (searchTerm: string): Promise<AutocompleteResponse> => {
    // Controlla se siamo in rate limit
    if (rateLimitRef.current.blocked && Date.now() < rateLimitRef.current.until) {
      const waitTime = Math.ceil((rateLimitRef.current.until - Date.now()) / 1000)
      throw new Error(`Troppe richieste. Attendi ${waitTime} secondi.`)
    }

    try {
      const data = await searchApi.autocomplete(searchTerm.trim())
      
      // Reset rate limit se la richiesta è andata a buon fine
      rateLimitRef.current = { blocked: false, until: 0 }
      
      return data
    } catch (error: unknown) {
      // Gestisci rate limiting (429)
      if (error instanceof AxiosError && error.response?.status === 429) {
        const retryAfter = 30 // secondi
        rateLimitRef.current = {
          blocked: true,
          until: Date.now() + (retryAfter * 1000)
        }
        throw new Error(`Troppe richieste. Attendi ${retryAfter} secondi.`)
      }
      throw error
    }
  }, [])

  // Funzione per chiamare API by-oracle-ids-paginated con più ID
  // Usa l'endpoint dedicato del backend Python per ricerca efficiente
  const fetchByOracleIds = useCallback(async (oracleIds: string[]): Promise<AutocompleteResponse> => {
    // Controlla se siamo in rate limit
    if (rateLimitRef.current.blocked && Date.now() < rateLimitRef.current.until) {
      const waitTime = Math.ceil((rateLimitRef.current.until - Date.now()) / 1000)
      throw new Error(`Troppe richieste. Attendi ${waitTime} secondi.`)
    }

    try {
      // Limita a max 100 IDs (limite backend)
      const limitedIds = oracleIds.slice(0, 100)

      // Usa l'endpoint dedicato per ricerca per IDs (molto più efficiente!)
      const data = await searchApi.searchByOracleIdsPaginated({
        ids: limitedIds,
        page: 1,
        sort: 'relevance',
        per_page: 10, // Limita a 10 risultati per autocomplete
      })

      // Reset rate limit se la richiesta è andata a buon fine
      rateLimitRef.current = { blocked: false, until: 0 }

      // Converte SearchResultsResponse in AutocompleteResponse
      // Il backend restituisce SearchResultsResponse con data.data come array di Card/Set
      if (data.success && data.data?.data) {
        // Mappa i risultati al formato Printing per autocomplete
        // Filtra solo le carte (esclude i set) e mappa al formato Printing
        const printings: Printing[] = data.data.data
          .filter((item): item is Card & { type?: 'card' } => {
            // Verifica che sia una Card (ha oracle_id o printing_id, non ha code come i Set)
            return ('oracle_id' in item || 'printing_id' in item) && !('code' in item)
          })
          .map((item) => ({
            printing_id: item.printing_id || (typeof item.id === 'string' ? item.id : '') || '',
            oracle_id: item.oracle_id || '',
            name: item.name || item.printed_name || '',
            set_name: item.set_name || item.set_code || '',
            collector_number: item.collector_number || '',
            image_uri_small: item.image_uri_small || null,
            image_uri_normal: item.image_uri_normal || null, // Aggiungi immagine classica
          } as Printing))

        return {
          success: true,
          cached: data.cached || false,
          data: printings,
        }
      }

      return {
        success: true,
        cached: false,
        data: [],
      }
    } catch (error: unknown) {
      // Gestisci rate limiting (429)
      if (error instanceof AxiosError && error.response?.status === 429) {
        const retryAfter = 30 // secondi
        rateLimitRef.current = {
          blocked: true,
          until: Date.now() + (retryAfter * 1000)
        }
        throw new Error(`Troppe richieste. Attendi ${retryAfter} secondi.`)
      }
      throw error
    }
  }, [])

  // Funzione principale di ricerca
  const performSearch = useCallback(async (searchTerm: string) => {
    // Reset error e translatedName
    setError(null)
    setTranslatedName(null)

    // Se il termine è troppo corto, reset
    if (searchTerm.trim().length < minLength) {
      setResults([])
      setLoading(false)
      setCached(false)
      return
    }

    // Cancella richiesta precedente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Crea nuovo AbortController
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)

    try {
      // CASO 1: Lingua inglese (default) - usa API standard
      if (selectedLang === 'en') {
        const data = await fetchEnglishAutocomplete(searchTerm)
        
        if (!controller.signal.aborted) {
          if (data.success && Array.isArray(data.data)) {
            // Processa risultati misti (carte e set)
            const processedResults: AutocompleteResultWithTranslation[] = data.data.map((result: AutocompleteResult) => {
              if (result.type === 'set') {
                // È un set, restituiscilo così com'è
                return { ...result, type: 'set' } as Set & { type: 'set' }
              } else {
                // È una carta (Printing)
                return { ...result, type: 'card' } as PrintingWithTranslation
              }
            })
            setResults(processedResults)
            setCached(data.cached || false)
            setError(null)
            setTranslatedName(null) // Nessuna traduzione per inglese
          } else {
            setResults([])
            setCached(false)
            setError(data.error || 'Errore durante la ricerca')
          }
        }
        return
      }

      // CASO 2: Altre lingue - usa ricerca ibrida con Fuse.js
      // Aspetta che il dizionario sia caricato
      if (isLangLoading || !fuseDictionary || !idToPreferredName || Object.keys(idToPreferredName).length === 0) {
        // Dizionario non ancora caricato: aspetta o fallback a ricerca inglese
        if (isLangLoading) {
          // Aspetta che il dizionario finisca di caricare
          return
        }
        const data = await fetchEnglishAutocomplete(searchTerm)
        
        if (!controller.signal.aborted) {
          if (data.success && Array.isArray(data.data)) {
            // Processa risultati misti
            const processedResults: AutocompleteResultWithTranslation[] = data.data.map((result: AutocompleteResult) => {
              if (result.type === 'set') {
                return { ...result, type: 'set' } as Set & { type: 'set' }
              } else {
                return { ...result, originalName: result.name, type: 'card' } as PrintingWithTranslation
              }
            })
            setResults(processedResults)
            setCached(data.cached || false)
            setError(null)
            setTranslatedName(null)
          } else {
            setResults([])
            setCached(false)
            setError(data.error || 'Errore durante la ricerca')
          }
        }
        return
      }

      // Cerca nel dizionario Fuse.js (cerca sia in 'preferred' che in 'name')
      const fuseResults = fuseDictionary.search(searchTerm.trim(), { limit: 10 })

      // CASO 2a: Nessun risultato nel dizionario - FALLBACK a ricerca inglese
      if (fuseResults.length === 0) {
        const data = await fetchEnglishAutocomplete(searchTerm)
        
        if (!controller.signal.aborted) {
          if (data.success && Array.isArray(data.data)) {
            // Processa risultati misti
            const processedResults: AutocompleteResultWithTranslation[] = data.data.map((result: AutocompleteResult) => {
              if (result.type === 'set') {
                return { ...result, type: 'set' } as Set & { type: 'set' }
              } else {
                return { ...result, originalName: result.name, type: 'card' } as PrintingWithTranslation
              }
            })
            setResults(processedResults)
            setCached(data.cached || false)
            setError(null)
            setTranslatedName(null)
          } else {
            setResults([])
            setCached(false)
            setError(data.error || 'Errore durante la ricerca')
          }
        }
        return
      }

      // CASO 2b: Trovati risultati nel dizionario - traduzione riuscita!
      // Estrai gli Oracle IDs unici dai risultati Fuse.js
      const oracleIds = [...new Set(fuseResults.map(result => result.item.id))]
      
      // Crea mappa id -> preferredName per mappare i risultati
      const idToPreferredMap: Record<string, string> = {}
      fuseResults.forEach(result => {
        idToPreferredMap[result.item.id] = result.item.preferred
      })

      // Chiama API by-oracle-id con tutti gli ID trovati
      const data = await fetchByOracleIds(oracleIds)
      
      if (!controller.signal.aborted) {
        if (data.success && Array.isArray(data.data)) {
          // Mappa i risultati sostituendo il nome con il preferredName quando disponibile
          // Nota: fetchByOracleIds restituisce solo carte, non set
          const mappedResults: AutocompleteResultWithTranslation[] = data.data
            .filter((result): result is Printing => result.type !== 'set')
            .map((printing: Printing) => {
              const preferredName = idToPreferredMap[printing.oracle_id]
              return {
                ...printing, // Preserva tutti i campi incluso image_uri_small
                name: preferredName || printing.name, // Usa preferredName se disponibile, altrimenti name originale
                preferredName: preferredName || undefined,
                originalName: printing.name, // Salva sempre il nome inglese originale
                type: 'card' as const,
              }
            })
          
          setResults(mappedResults)
          setCached(data.cached || false)
          setError(null)
          // Imposta il primo nome tradotto trovato come translatedName
          setTranslatedName(fuseResults[0]?.item?.preferred || null)
        } else {
          setResults([])
          setCached(false)
          setError(data.error || 'Errore durante la ricerca')
        }
      }
    } catch (err) {
      // Ignora errori di cancellazione
      if (err instanceof Error && err.name !== 'AbortError') {
        let errorMessage = 'Errore durante la ricerca'
        
        if (err.message.includes('Troppe richieste')) {
          errorMessage = err.message
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Errore di connessione'
        } else if (err.message.includes('HTTP error')) {
          if (err.message.includes('429')) {
            errorMessage = 'Troppe richieste. Attendi qualche secondo prima di riprovare.'
          } else {
            errorMessage = `Errore del server: ${err.message}`
          }
        }
        
        setError(errorMessage)
        setResults([])
        setCached(false)
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [selectedLang, fuseDictionary, idToPreferredName, isLangLoading, minLength, fetchEnglishAutocomplete, fetchByOracleIds])

  // Effect per debounce
  useEffect(() => {
    // Cancella timeout precedente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce: aspetta prima di eseguire la ricerca
    timeoutRef.current = setTimeout(() => {
      performSearch(term)
    }, debounceMs)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [term, performSearch, debounceMs])

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { results, loading, error, cached, translatedName }
}

