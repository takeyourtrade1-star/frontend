/**
 * Hook per recuperare solo le ristampe di una carta
 */

import { useState, useEffect } from 'react'
import { AxiosError } from 'axios'
import { searchApi } from '@/lib/searchApi'
import type { CardPrintingsResponse, NavigationPrinting } from '@/types'

export function useCardPrintings(oracleId: string) {
  const [cardName, setCardName] = useState<string | null>(null)
  const [printings, setPrintings] = useState<NavigationPrinting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    if (!oracleId) {
      setLoading(false)
      return
    }

    async function fetchPrintings() {
      try {
        setLoading(true)
        setError(null)

        const data = await searchApi.getCardPrintings(oracleId)

        if (data.success && data.data) {
          setCardName(data.data.card_name)
          setPrintings(data.data.printings || [])
          setCached(data.cached || false)
        } else {
          throw new Error(data.error || 'Failed to fetch printings')
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          setError('Carta non trovata')
        } else if (err instanceof Error) {
          setError(err.message || 'Error fetching printings')
        } else {
          setError('Error fetching printings')
        }
        setCardName(null)
        setPrintings([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrintings()
  }, [oracleId])

  return { cardName, printings, loading, error, cached }
}

