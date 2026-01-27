/**
 * ShoppingCartTab Component
 * Tab per visualizzare il carrello acquisti
 */

import { useState, useEffect } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, Package, Truck, Euro } from 'lucide-react'
import { fetchCartItems } from '@/services/accountService'
import type { CartItem } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ShoppingCartTab() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      setIsLoading(true)
      const cartItems = await fetchCartItems()
      setItems(cartItems)
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + delta),
              total_price: (item.quantity + delta) * item.unit_price,
            }
          : item
      )
    )
  }

  const handleRemoveItem = (itemId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const shipping = subtotal > 0 ? 5.00 : 0
  const total = subtotal + shipping

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Carrello Vuoto</h3>
        <p className="text-gray-600">Non ci sono articoli nel tuo carrello.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-500" />
          Carrello ({items.length} articoli)
        </h2>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-orange-500 transition-colors"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <img
                  src={item.image_url}
                  alt={item.card_name}
                  className="w-16 h-24 object-cover rounded-lg"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{item.card_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.set_name}</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {item.seller_username}
                  </span>
                  <span>•</span>
                  <span>Condizione: {item.condition}</span>
                  <span>•</span>
                  <span>Lingua: {item.language}</span>
                  {item.is_foil && (
                    <>
                      <span>•</span>
                      <span className="text-orange-500 font-semibold">Foil</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity & Actions */}
              <div className="flex-shrink-0 flex flex-col items-end gap-4">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Rimuovi"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Diminuisci quantità"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Aumenta quantità"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-600">Unit: {formatCurrency(item.unit_price)}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(item.total_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Euro className="w-5 h-5 text-orange-500" />
          Riepilogo
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotoale</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Spedizione
            </span>
            <span>{formatCurrency(shipping)}</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold text-gray-900">
            <span>Totale</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button className="btn-primary w-full mt-6" onClick={() => alert('Procedi al checkout - TODO')}>
          Procedi al Checkout
        </button>
      </div>
    </div>
  )
}


