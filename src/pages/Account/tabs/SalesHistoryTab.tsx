/**
 * SalesHistoryTab Component
 * Tab per visualizzare cronologia vendite
 */

import { useState, useEffect } from 'react'
import { FileText, Search, Filter, Calendar } from 'lucide-react'
import { fetchSalesHistory } from '@/services/accountService'
import type { Order } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending: 'In Attesa',
  processing: 'Elaborazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Cancellato',
}

export default function SalesHistoryTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [orderNumberFilter, setOrderNumberFilter] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadOrders()
  }, [currentPage, itemsPerPage])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetchSalesHistory(currentPage, itemsPerPage, {
        order_number: orderNumberFilter,
        buyer: buyerFilter,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      })
      setOrders(response.data)
      setTotalPages(response.last_page)
      setTotalItems(response.total)
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setIsLoading(false)
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Nr. Ordine
            </label>
            <input
              type="text"
              value={orderNumberFilter}
              onChange={(e) => setOrderNumberFilter(e.target.value)}
              placeholder="SAL-000001"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Compratore
            </label>
            <input
              type="text"
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              placeholder="Username"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Tutti</option>
              <option value="pending">In Attesa</option>
              <option value="processing">Elaborazione</option>
              <option value="shipped">Spedito</option>
              <option value="delivered">Consegnato</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Da
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              A
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <button onClick={loadOrders} className="btn-primary mt-4 w-full md:w-auto">
          Applica Filtri
        </button>
      </div>

      {/* Orders Table */}
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
                      Nr. Ordine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compratore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Articoli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.buyer_username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.items_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total_value)}
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




