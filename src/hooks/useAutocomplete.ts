/**
 * useAutocomplete Hook
 * Custom hook per gestire l'autocomplete con debounce e AbortController
 * Aggiornato secondo la nuova struttura API
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchApi } from '@/lib/searchApi'
import type { AutocompleteResponse, AutocompleteResult } from '@/config/searchApi'

interface UseAutocompleteOptions {
  debounceMs?: number
  minLength?: number
}

interface UseAutocompleteResult {
  results: AutocompleteResult[]
  loading: boolean
  error: string | null
  cached: boolean
}

export function useAutocomplete(
  term: string,
  options: UseAutocompleteOptions = {}
): UseAutocompleteResult {
  const {
    debounceMs = 150, // Ottimizzato per velocità 
    minLength = 2,
  } = options

  const [results, setResults] = useState<AutocompleteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchAutocomplete = useCallback(async (searchTerm: string) => {
    // Reset error
    setError(null)

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
      const data = await searchApi.autocomplete(searchTerm.trim())
      
      // Verifica che la richiesta non sia stata cancellata
      if (!controller.signal.aborted) {
        if (data.success && Array.isArray(data.data)) {
          // Successo!
          setResults(data.data)
          setCached(data.cached || false)
          setError(null)
        } else {
          // Risposta OK ma success: false
          setResults([])
          setCached(false)
          if (data.error) {
            setError(data.error)
          } else {
            setError('Errore sconosciuto durante la ricerca')
          }
        }
      }
    } catch (err) {
      // Ignora errori di cancellazione
      if (err instanceof Error && err.name !== 'AbortError' && !controller.signal.aborted) {
        let errorMessage = 'Errore durante la ricerca'
        
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Errore di connessione'
        } else if (err.message.includes('HTTP error') || err.message.includes('status')) {
          errorMessage = `Errore del server: ${err.message}`
        }
        
        setError(errorMessage)
        setResults([])
        setCached(false)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [minLength])

  useEffect(() => {
    // Cancella timeout precedente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce: aspetta prima di eseguire la ricerca
    timeoutRef.current = setTimeout(() => {
      fetchAutocomplete(term)
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
  }, [term, fetchAutocomplete, debounceMs])

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

  return { results, loading, error, cached }
}
