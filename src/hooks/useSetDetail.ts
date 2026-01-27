/**
 * Hook per recuperare il dettaglio di un set con tutte le sue carte
 */

import { useState, useEffect } from 'react'
import { AxiosError } from 'axios'
import { searchApi } from '@/lib/searchApi'
import type { SetDetailResponse, NavigationSet, NavigationPrinting } from '@/types'

export function useSetDetail(setCode: string) {
  const [setInfo, setSetInfo] = useState<NavigationSet | null>(null)
  const [cards, setCards] = useState<NavigationPrinting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    if (!setCode) {
      setLoading(false)
      return
    }

    async function fetchSetDetail() {
      try {
        setLoading(true)
        setError(null)

        const data = await searchApi.getSetDetail(setCode)

        if (data.success && data.data) {
          setSetInfo(data.data.set_info)
          setCards(data.data.cards || [])
          setCached(data.cached || false)
        } else {
          throw new Error(data.error || 'Failed to fetch set detail')
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          setError('Set not found')
        } else if (err instanceof Error) {
          setError(err.message || 'Error fetching set detail')
        } else {
          setError('Error fetching set detail')
        }
        setSetInfo(null)
        setCards([])
      } finally {
        setLoading(false)
      }
    }

    fetchSetDetail()
  }, [setCode])

  return { setInfo, cards, loading, error, cached }
}



