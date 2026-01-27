/**
 * SearchDebug Component
 * Componente di debug per testare la connessione all'API di ricerca
 */

import { useState } from 'react'
import { searchApiConfig } from '@/config/searchApi'

export default function SearchDebug() {
  const [status, setStatus] = useState<string>('')
  const [details, setDetails] = useState<any>(null)

  const testHealth = async () => {
    setStatus('Testing health endpoint...')
    setDetails(null)
    
    try {
      const response = await fetch(searchApiConfig.endpoints.health)
      const data = await response.json()
      setStatus('✅ Health OK')
      setDetails({ health: data })
    } catch (error: any) {
      setStatus('❌ Health Error')
      setDetails({ error: error.message, stack: error.stack })
    }
  }

  const testAutocomplete = async () => {
    setStatus('Testing autocomplete endpoint...')
    setDetails(null)
    
    try {
      const url = `${searchApiConfig.endpoints.autocomplete}?term=black`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      setStatus('✅ Autocomplete OK')
      setDetails({ 
        url,
        response: data,
        cardsCount: data.cards?.length || 0,
        setsCount: data.sets?.length || 0
      })
    } catch (error: any) {
      setStatus('❌ Autocomplete Error')
      setDetails({ 
        error: error.message, 
        stack: error.stack,
        url: `${searchApiConfig.endpoints.autocomplete}?term=black`
      })
    }
  }

  const testSearch = async () => {
    setStatus('Testing search endpoint...')
    setDetails(null)
    
    try {
      const url = `${searchApiConfig.endpoints.search}?term=black&page=1&sort=relevance`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      setStatus('✅ Search OK')
      setDetails({ 
        url,
        response: data,
        dataCount: data.data?.length || 0,
        pagination: data.pagination
      })
    } catch (error: any) {
      setStatus('❌ Search Error')
      setDetails({ 
        error: error.message, 
        stack: error.stack,
        url: `${searchApiConfig.endpoints.search}?term=black&page=1&sort=relevance`
      })
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Search API Debug</h2>
      
      <div className="mb-4 space-y-2">
        <div className="text-sm text-gray-600">
          <strong>Base URL:</strong> {searchApiConfig.baseUrl}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Autocomplete:</strong> {searchApiConfig.endpoints.autocomplete}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Search:</strong> {searchApiConfig.endpoints.search}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testHealth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Health
        </button>
        <button
          onClick={testAutocomplete}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Autocomplete
        </button>
        <button
          onClick={testSearch}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Search
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded ${status.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="font-semibold mb-2">{status}</div>
          {details && (
            <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
              {JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}