/**
 * Hook per recuperare la lista di tutti i set Magic: The Gathering
 */

import { useState, useEffect } from 'react'
import { searchApi } from '@/lib/searchApi'
import type { SetListResponse, NavigationSet } from '@/types'

export function useSets() {
  const [sets, setSets] = useState<NavigationSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    async function fetchSets() {
      try {
        setLoading(true)
        setError(null)

        const data = await searchApi.getSets()

        if (data.success && Array.isArray(data.data)) {
          setSets(data.data)
          setCached(data.cached || false)
        } else {
          throw new Error(data.error || 'Failed to fetch sets')
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching sets')
        setSets([])
      } finally {
        setLoading(false)
      }
    }

    fetchSets()
  }, [])

  return { sets, loading, error, cached }
}



