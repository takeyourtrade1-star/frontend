/**
 * CollectionPage
 * Pagina della collezione carte dell'utente
 */

import { useEffect, useState, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useCollectionStore } from '@/store/collectionStore'
import { useActivityStatusStore } from '@/store/activityStatusStore'
import CollectionDataTable from '@/components/collection/CollectionDataTable'
import CollectionFilterSidebar from '@/components/collection/CollectionFilterSidebar'
import CollectionSearchBar from '@/components/collection/CollectionSearchBar'
import CardModal from '@/components/collection/CardModal'
import type { CollectionItem } from '@/types'

export default function CollectionPage() {
  const { activityStatus } = useActivityStatusStore()
  const {
    items,
    isLoading,
    error,
    filters,
    searchQuery,
    pagination,
    fetchCollection,
    addItem,
    updateItem,
    deleteItem,
    setFilters,
    setSearchQuery,
    clearFilters,
    clearError,
  } = useCollectionStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const isInitialMount = useRef(true)
  const lastFetchParams = useRef<{ filters: string; search: string; page: number }>({
    filters: '',
    search: '',
    page: 1
  })

  // Fetch collection on mount and when dependencies change
  useEffect(() => {
    const filtersStr = JSON.stringify(filters)
    const paramsKey = `${filtersStr}|${searchQuery}|${pagination.page}`
    
    // Prevent duplicate fetches with same parameters
    const lastKey = `${lastFetchParams.current.filters}|${lastFetchParams.current.search}|${lastFetchParams.current.page}`
    
    if (!isInitialMount.current && paramsKey === lastKey) {
      return
    }

    const loadCollection = async () => {
      try {
        lastFetchParams.current = {
          filters: filtersStr,
          search: searchQuery,
          page: pagination.page
        }
        await fetchCollection(pagination.page, pagination.per_page)
      } catch (err) {
        // Silently handle collection loading errors
      }
    }
    
    loadCollection()
    
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, pagination.page])

  const handleAddClick = () => {
    setSelectedItem(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditClick = (item: CollectionItem) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleSubmit = async (data: Partial<CollectionItem>) => {
    if (modalMode === 'add') {
      await addItem(data)
    } else if (selectedItem) {
      await updateItem(selectedItem.id, data)
    }
    handleModalClose()
  }

  const handleDelete = async (item: CollectionItem) => {
    await deleteItem(item.id)
  }

  const handlePageChange = (newPage: number) => {
    fetchCollection(newPage, pagination.per_page)
  }

  const handleRefresh = async () => {
    await fetchCollection(pagination.page, pagination.per_page)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              La Mia Collezione
            </h1>
            {pagination.total > 0 && (
              <p className="text-gray-600">
                {pagination.total} {pagination.total === 1 ? 'carta' : 'carte'} nella collezione
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Aggiungi Carta</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Errore</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Vacation Status Notice */}
        {activityStatus === 'vacanza' && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-medium text-orange-800">
              ⚠️ La tua collezione è attualmente nascosta pubblicamente perché sei in vacanza.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <CollectionSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <CollectionFilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Table */}
          <div className="lg:col-span-3">
            <CollectionDataTable
              items={items}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Precedente
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Pagina {pagination.page} di {pagination.total_pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages || isLoading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Successiva
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <CardModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          initialData={selectedItem}
          mode={modalMode}
        />
      </div>
    </div>
  )
}

