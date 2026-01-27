/**
 * ListedArticlesTab Component
 * Tab per visualizzare e gestire articoli in vendita
 */

import { useState, useEffect } from 'react'
import { Package, Edit, Trash2, Search, Filter, ArrowUpDown, TrendingUp } from 'lucide-react'
import { fetchListedArticles } from '@/services/accountService'
import { useActivityStatusStore } from '@/store/activityStatusStore'
import type { ListedArticle, SortDirection } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'

type SortField = 'card_name' | 'price' | 'listed_date' | 'views'

export default function ListedArticlesTab() {
  const { activityStatus } = useActivityStatusStore()
  const [articles, setArticles] = useState<ListedArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Sort state
  const [sortField, setSortField] = useState<SortField>('listed_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filters
  const [cardNameFilter, setCardNameFilter] = useState('')
  const [setNameFilterValue, setSetNameFilterValue] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [foilFilter, setFoilFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadArticles()
  }, [currentPage, itemsPerPage, sortField, sortDirection])

  const loadArticles = async () => {
    try {
      setIsLoading(true)
      const response = await fetchListedArticles(currentPage, itemsPerPage, {
        card_name: cardNameFilter,
        set_name: setNameFilterValue,
        language: languageFilter,
        condition: conditionFilter,
        foil: foilFilter,
        status: statusFilter,
        sort_field: sortField,
        sort_direction: sortDirection,
      })
      setArticles(response.data)
      setTotalPages(response.last_page)
      setTotalItems(response.total)
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    sold_out: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    active: 'Attivo',
    paused: 'In Pausa',
    sold_out: 'Esaurito',
  }

  const SortButton = ({ field }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-orange-500 transition-colors"
    >
      {field === sortField && sortDirection === 'asc' && <ArrowUpDown className="w-4 h-4 rotate-180" />}
      {field === sortField && sortDirection === 'desc' && <ArrowUpDown className="w-4 h-4" />}
      {field !== sortField && <TrendingUp className="w-4 h-4 opacity-0" />}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Vacation Status Notice */}
      {activityStatus === 'vacanza' && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm font-medium text-orange-800">
            ⚠️ Le tue carte in vendita sono attualmente sospese perché sei in vacanza.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Nome Carta
            </label>
            <input
              type="text"
              value={cardNameFilter}
              onChange={(e) => setCardNameFilter(e.target.value)}
              placeholder="Cerca carta..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Set</label>
            <input
              type="text"
              value={setNameFilterValue}
              onChange={(e) => setSetNameFilterValue(e.target.value)}
              placeholder="Nome set..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lingua</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tutte</option>
              <option value="Italian">Italiano</option>
              <option value="English">Inglese</option>
              <option value="German">Tedesco</option>
              <option value="French">Francese</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condizione</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tutte</option>
              <option value="NM">Near Mint</option>
              <option value="SP">Slightly Played</option>
              <option value="MP">Moderately Played</option>
              <option value="HP">Heavily Played</option>
              <option value="PO">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foil</label>
            <select
              value={foilFilter}
              onChange={(e) => setFoilFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tutti</option>
              <option value="true">Solo Foil</option>
              <option value="false">Solo Non-Foil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tutti</option>
              <option value="active">Attivi</option>
              <option value="paused">In Pausa</option>
              <option value="sold_out">Esauriti</option>
            </select>
          </div>
        </div>
        <button onClick={loadArticles} className="btn-primary mt-4 w-full md:w-auto">
          Applica Filtri
        </button>
      </div>

      {/* Articles Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Immagine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome Carta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Set
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lingua
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantità
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visualizzazioni
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={article.image_url}
                          alt={article.card_name}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {article.card_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {article.set_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {article.language}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {article.condition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {article.is_foil ? (
                          <span className="text-orange-500 font-semibold">Sì</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {article.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(article.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(article.listed_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {article.views}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert('Modifica articolo - TODO')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert('Elimina articolo - TODO')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

