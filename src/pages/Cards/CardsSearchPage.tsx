/**
 * CardsSearchPage
 * Pagina di ricerca carte con integrazione API backend
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { Search, Filter, Loader2, ExternalLink } from 'lucide-react'
import { searchApi } from '@/lib/searchApi'
import type { Card, SearchResult, SearchResultsResponse } from '@/config/searchApi'

export default function CardsSearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Estrai query dalla URL e esegui ricerca
  useEffect(() => {
    // Supporta sia 'q' (legacy) che 'term' (nuovo)
    const query = searchParams.get('term') || searchParams.get('q') || ''
    setSearchQuery(query)
    
    if (query) {
      performSearch(query, 1)
    } else {
      setCards([])
      setTotalResults(0)
      setCurrentPage(1)
      setError(null)
    }
  }, [searchParams])

  // Funzione per eseguire la ricerca
  const performSearch = async (query: string, page: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      // Usa la nuova API Python con parametro 'term'
      const data = await searchApi.searchResults({
        term: query.trim(),
        page: page,
        sort: 'relevance',
        per_page: 20,
      })

      if (data.success && data.data) {
        // La nuova API restituisce SearchResultsResponse con struttura diversa
        const results = data.data.data || []
        // Filtra solo le carte (escludi i set se presenti)
        const cardsOnly = results.filter((result: SearchResult) => result.type !== 'set') as Card[]
        setCards(cardsOnly)
        setTotalResults(data.data.pagination?.total_results || 0)
        setCurrentPage(page)
      } else {
        throw new Error(data.error || 'Errore sconosciuto nella risposta API')
      }
    } catch (err: unknown) {
      let errorMessage = 'Errore durante la ricerca. Riprova più tardi.'
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 422) {
          errorMessage = 'Parametri di ricerca non validi. Verifica i parametri inseriti.'
        } else if (err.response?.status === 429) {
          errorMessage = 'Troppe richieste. Attendi qualche secondo prima di riprovare.'
        } else if (err.response?.status === 500) {
          errorMessage = 'Errore interno del server. Riprova più tardi.'
        } else if (err.response?.status) {
          errorMessage = `Errore del server: status ${err.response.status}`
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setCards([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Gestione click su carta
  const handleCardClick = (card: Card) => {
    // Usa oracle_id e printing_id se disponibili, altrimenti usa id come fallback
    if (card.oracle_id && card.printing_id) {
      const url = `/card/${card.oracle_id}?printing_id=${card.printing_id}`
      navigate(url)
    } else if (card.oracle_id) {
      const url = `/card/${card.oracle_id}`
      navigate(url)
    } else if (card.id) {
      // Fallback legacy: usa id come oracle_id se disponibile
      const url = `/card/${card.id}`
      navigate(url)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con query di ricerca */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Risultati per "${searchQuery}"` : 'Cerca Carte'}
          </h1>
          {searchQuery && (
            <p className="text-gray-600">
              {isLoading ? 'Ricerca in corso...' : `${totalResults} risultati trovati`}
            </p>
          )}
        </div>

        {/* Filtri (placeholder) */}
        {searchQuery && cards.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtri</span>
            </button>
            <div className="text-sm text-gray-500">
              Set • Rarità • Tipo • Colore
            </div>
          </div>
        )}

        {/* Risultati o placeholder */}
        {isLoading ? (
          <div className="card p-12 text-center">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-600">Ricerca in corso...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card p-12 text-center">
            <div className="text-red-600 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">{error}</p>
            </div>
          </div>
        ) : searchQuery && cards.length === 0 ? (
          <div className="card p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">
              Nessun risultato trovato per "{searchQuery}"
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Prova con termini diversi o usa i filtri
            </p>
          </div>
        ) : searchQuery && cards.length > 0 ? (
          <div className="space-y-6">
            {/* Griglia delle carte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {cards.map((card) => (
                <div
                  key={card.printing_id || card.oracle_id || card.id}
                  className="card card-hover-lift p-4 group cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  {/* Immagine carta */}
                  <div className="aspect-[488/680] mb-4 rounded-lg overflow-hidden bg-gray-100">
                    {card.front_image_url ? (
                      <img
                        src={card.front_image_url}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Info carta */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                      {card.name}
                    </h3>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {card.type && (
                        <div className="truncate">{card.type}</div>
                      )}
                      {card.set_name && (
                        <div className="text-xs text-gray-500 truncate">
                          {card.set_name}
                        </div>
                      )}
                      {card.rarity && (
                        <div className="text-xs text-gray-500">
                          {card.rarity}
                        </div>
                      )}
                    </div>

                    {/* Prezzo */}
                    {card.price_eur && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-orange-600">
                          €{typeof card.price_eur === 'string' ? parseFloat(card.price_eur).toFixed(2) : card.price_eur.toFixed(2)}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginazione */}
            {totalResults > 20 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                <button
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  onClick={() => performSearch(searchQuery, currentPage - 1)}
                >
                  Precedente
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Pagina {currentPage} di {Math.ceil(totalResults / 20)}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(totalResults / 20)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  onClick={() => performSearch(searchQuery, currentPage + 1)}
                >
                  Successiva
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">
              Inizia a cercare carte Magic: The Gathering
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Usa la barra di ricerca in alto per trovare le tue carte preferite
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

