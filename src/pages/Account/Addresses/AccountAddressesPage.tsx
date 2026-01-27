/**
 * AccountAddressesPage Component
 * Page for managing user addresses (main + secondary)
 */

import { useState, useEffect } from 'react'
import { Plus, Truck, Edit, Trash2, X, Save, Loader2, AlertCircle, CheckCircle, Star } from 'lucide-react'
import { 
  getAddresses, 
  updateMainAddress, 
  createSecondaryAddress, 
  updateSecondaryAddress, 
  deleteSecondaryAddress 
} from '@/services/accountService'
import type { MainAddress, SecondaryAddress } from '@/types/account'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'

export default function AccountAddressesPage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [mainAddress, setMainAddress] = useState<MainAddress | null>(null)
  const [secondaryAddresses, setSecondaryAddresses] = useState<SecondaryAddress[]>([])
  
  // Main address editing
  const [isEditingMain, setIsEditingMain] = useState(false)
  const [isUpdatingMain, setIsUpdatingMain] = useState(false)
  const [mainAddressForm, setMainAddressForm] = useState({
    address: '',
    street: '',
    city: '',
    postal_code: '',
    province: '',
    country: 'IT',
  })
  const [mainAddressErrors, setMainAddressErrors] = useState<Record<string, string>>({})
  const [mainAddressSuccess, setMainAddressSuccess] = useState(false)

  // Secondary address editing
  const [isCreatingSecondary, setIsCreatingSecondary] = useState(false)
  const [editingSecondaryId, setEditingSecondaryId] = useState<number | null>(null)
  const [isSubmittingSecondary, setIsSubmittingSecondary] = useState(false)
  const [secondaryAddressForm, setSecondaryAddressForm] = useState({
    label: '',
    street_address: '',
    street_address_2: '',
    city: '',
    postal_code: '',
    province: '',
    country: 'IT',
    is_default: false,
    address_type: 'other' as 'shipping' | 'billing' | 'other',
    notes: '',
  })
  const [secondaryAddressErrors, setSecondaryAddressErrors] = useState<Record<string, string>>({})
  const [secondaryAddressSuccess, setSecondaryAddressSuccess] = useState(false)

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setIsLoading(true)
        const data = await getAddresses()
        setMainAddress(data.main_address)
        setSecondaryAddresses(data.secondary_addresses || [])
        
        // Parse main address location for editing
        if (data.main_address.location) {
          const locationParts = data.main_address.location.split(',').map((p: string) => p.trim())
          setMainAddressForm({
            address: locationParts[0] || '',
            street: locationParts[1] || '',
            city: data.main_address.city || locationParts[2] || '',
            postal_code: locationParts[3] || '',
            province: locationParts[4] || '',
            country: data.main_address.country || 'IT',
          })
        }
      } catch (error: any) {
        alert(error.message || 'Errore durante il caricamento degli indirizzi')
      } finally {
        setIsLoading(false)
      }
    }

    loadAddresses()
  }, [])

  // Parse main address location string
  const parseMainAddress = (location: string) => {
    const parts = location.split(',').map((p: string) => p.trim())
    return {
      address: parts[0] || '',
      street: parts[1] || '',
      city: parts[2] || '',
      postal_code: parts[3] || '',
      province: parts[4] || '',
      country: parts[5] || 'IT',
    }
  }

  // Handle main address update
  const handleMainAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMainAddressErrors({})
    setMainAddressSuccess(false)

    // Validate
    const errors: Record<string, string> = {}
    if (!mainAddressForm.address.trim()) errors.address = 'Indirizzo obbligatorio'
    if (!mainAddressForm.city.trim()) errors.city = 'Città obbligatoria'
    if (!mainAddressForm.postal_code.trim()) errors.postal_code = 'CAP obbligatorio'
    if (!mainAddressForm.province.trim()) errors.province = 'Provincia obbligatoria'
    if (!mainAddressForm.country.trim()) errors.country = 'Nazione obbligatoria'

    if (Object.keys(errors).length > 0) {
      setMainAddressErrors(errors)
      return
    }

    try {
      setIsUpdatingMain(true)
      const response = await updateMainAddress(mainAddressForm)
      
      if (response.success && response.data?.main_address) {
        setMainAddress(response.data.main_address)
        setMainAddressSuccess(true)
        setTimeout(() => {
          setIsEditingMain(false)
          setMainAddressSuccess(false)
        }, 2000)
      }
    } catch (error: any) {
      // Silently handle update errors
      setMainAddressErrors({ general: error.message || 'Errore durante l\'aggiornamento dell\'indirizzo' })
    } finally {
      setIsUpdatingMain(false)
    }
  }

  // Handle secondary address create/edit
  const handleSecondaryAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecondaryAddressErrors({})
    setSecondaryAddressSuccess(false)

    // Validate
    const errors: Record<string, string> = {}
    if (!secondaryAddressForm.street_address.trim()) errors.street_address = 'Indirizzo obbligatorio'
    if (!secondaryAddressForm.city.trim()) errors.city = 'Città obbligatoria'
    if (!secondaryAddressForm.postal_code.trim()) errors.postal_code = 'CAP obbligatorio'
    if (!secondaryAddressForm.province.trim()) errors.province = 'Provincia obbligatoria'
    if (!secondaryAddressForm.country.trim()) errors.country = 'Nazione obbligatoria'

    if (Object.keys(errors).length > 0) {
      setSecondaryAddressErrors(errors)
      return
    }

    try {
      setIsSubmittingSecondary(true)
      
      if (editingSecondaryId) {
        // Update existing
        const response = await updateSecondaryAddress(editingSecondaryId, secondaryAddressForm)
        if (response.success && response.data?.address) {
          setSecondaryAddresses(prev => 
            prev.map(addr => addr.id === editingSecondaryId ? response.data!.address : addr)
          )
          setSecondaryAddressSuccess(true)
          setTimeout(() => {
            setIsCreatingSecondary(false)
            setEditingSecondaryId(null)
            resetSecondaryForm()
            setSecondaryAddressSuccess(false)
          }, 2000)
        }
      } else {
        // Create new
        const response = await createSecondaryAddress(secondaryAddressForm)
        if (response.success && response.data?.address) {
          setSecondaryAddresses(prev => [...prev, response.data!.address])
          setSecondaryAddressSuccess(true)
          setTimeout(() => {
            setIsCreatingSecondary(false)
            resetSecondaryForm()
            setSecondaryAddressSuccess(false)
          }, 2000)
        }
      }
    } catch (error: any) {
      // Silently handle save errors
      setSecondaryAddressErrors({ general: error.message || 'Errore durante il salvataggio dell\'indirizzo' })
    } finally {
      setIsSubmittingSecondary(false)
    }
  }

  // Handle delete secondary address
  const handleDeleteSecondary = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
      return
    }

    try {
      const response = await deleteSecondaryAddress(id)
      if (response.success) {
        setSecondaryAddresses(prev => prev.filter(addr => addr.id !== id))
      }
    } catch (error: any) {
      // Silently handle delete errors
      alert(error.message || 'Errore durante l\'eliminazione dell\'indirizzo')
    }
  }

  // Handle toggle default
  const handleToggleDefault = async (id: number) => {
    try {
      const address = secondaryAddresses.find(a => a.id === id)
      if (!address) return

      const response = await updateSecondaryAddress(id, {
        is_default: !address.is_default,
      })

      if (response.success && response.data?.address) {
        setSecondaryAddresses(prev =>
          prev.map(addr => {
            if (addr.id === id) {
              return response.data!.address
            }
            // Unset other defaults
            if (addr.is_default && addr.id !== id) {
              return { ...addr, is_default: false }
            }
            return addr
          })
        )
      }
    } catch (error: any) {
      // Silently handle update errors
      alert(error.message || 'Errore durante l\'aggiornamento dell\'indirizzo predefinito')
    }
  }

  // Reset secondary form
  const resetSecondaryForm = () => {
    setSecondaryAddressForm({
      label: '',
      street_address: '',
      street_address_2: '',
      city: '',
      postal_code: '',
      province: '',
      country: 'IT',
      is_default: false,
      address_type: 'other',
      notes: '',
    })
    setEditingSecondaryId(null)
    setSecondaryAddressErrors({})
  }

  // Start editing secondary
  const startEditingSecondary = (address: SecondaryAddress) => {
    setSecondaryAddressForm({
      label: address.label || '',
      street_address: address.street_address,
      street_address_2: address.street_address_2 || '',
      city: address.city,
      postal_code: address.postal_code,
      province: address.province,
      country: address.country,
      is_default: address.is_default,
      address_type: address.address_type,
      notes: address.notes || '',
    })
    setEditingSecondaryId(address.id)
    setIsCreatingSecondary(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Help Link */}
      <div className="flex justify-end">
        <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
          Hai bisogno di aiuto?
        </a>
      </div>

      {/* Main Address Card */}
      {mainAddress && (
        <div className="bg-white rounded-2xl shadow-apple border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-600">{mainAddress.label}</h3>
            {!isEditingMain ? (
              <button
                onClick={() => setIsEditingMain(true)}
                className="flex items-center gap-2 px-3 py-1 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Modifica</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditingMain(false)
                  setMainAddressErrors({})
                  setMainAddressSuccess(false)
                  // Reset form
                  if (mainAddress.location) {
                    const parsed = parseMainAddress(mainAddress.location)
                    setMainAddressForm({
                      address: parsed.address,
                      street: parsed.street,
                      city: mainAddress.city || parsed.city,
                      postal_code: parsed.postal_code,
                      province: parsed.province,
                      country: mainAddress.country || 'IT',
                    })
                  }
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {!isEditingMain ? (
            <div className="space-y-1">
              <p className="text-gray-700">{mainAddress.location}</p>
            </div>
          ) : (
            <form onSubmit={handleMainAddressSubmit} className="space-y-4 mt-4">
              {mainAddressSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">Indirizzo principale aggiornato con successo!</p>
                </div>
              )}
              
              {mainAddressErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{mainAddressErrors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo/Via *
                  </label>
                  <input
                    type="text"
                    value={mainAddressForm.address}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, address: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      mainAddressErrors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingMain}
                  />
                  {mainAddressErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{mainAddressErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Via aggiuntiva <span className="text-gray-400 text-xs">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={mainAddressForm.street}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isUpdatingMain}
                    placeholder="Scala A, Piano 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città *
                  </label>
                  <input
                    type="text"
                    value={mainAddressForm.city}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, city: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      mainAddressErrors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingMain}
                  />
                  {mainAddressErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{mainAddressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAP *
                  </label>
                  <input
                    type="text"
                    value={mainAddressForm.postal_code}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      mainAddressErrors.postal_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={5}
                    disabled={isUpdatingMain}
                  />
                  {mainAddressErrors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{mainAddressErrors.postal_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={mainAddressForm.province}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, province: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      mainAddressErrors.province ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingMain}
                  />
                  {mainAddressErrors.province && (
                    <p className="mt-1 text-sm text-red-600">{mainAddressErrors.province}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazione *
                  </label>
                  <select
                    value={mainAddressForm.country}
                    onChange={(e) => setMainAddressForm({ ...mainAddressForm, country: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      mainAddressErrors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingMain}
                  >
                    <option value="IT">Italia</option>
                    <option value="FR">Francia</option>
                    <option value="DE">Germania</option>
                    <option value="ES">Spagna</option>
                    <option value="UK">Regno Unito</option>
                    <option value="US">Stati Uniti</option>
                    <option value="NL">Paesi Bassi</option>
                  </select>
                  {mainAddressErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{mainAddressErrors.country}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingMain(false)
                    setMainAddressErrors({})
                    setMainAddressSuccess(false)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isUpdatingMain}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMain}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdatingMain ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salva
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Secondary Addresses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Indirizzi secondari</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Existing Secondary Addresses */}
          {secondaryAddresses.map((address) => (
            <div key={address.id} className="bg-white rounded-2xl shadow-apple border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {address.label || 'Indirizzo secondario'}
                    </h3>
                    {address.is_default && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-gray-600">Predefinito</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-gray-700">{address.full_location}</p>
                    {address.notes && (
                      <p className="text-sm text-gray-500 italic">{address.notes}</p>
                    )}
                    {address.address_type !== 'other' && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {address.address_type === 'shipping' ? 'Spedizione' : 'Fatturazione'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => startEditingSecondary(address)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit className="w-4 h-4 text-gray-900" />
                  </button>
                  <button
                    onClick={() => handleDeleteSecondary(address.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                  <button
                    onClick={() => handleToggleDefault(address.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      address.is_default 
                        ? 'bg-yellow-50 hover:bg-yellow-100' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={address.is_default ? 'Rimuovi come predefinito' : 'Imposta come predefinito'}
                  >
                    <Star className={`w-4 h-4 ${address.is_default ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Secondary Address Card */}
          {!isCreatingSecondary && (
            <div className="bg-white rounded-2xl shadow-apple border border-gray-100 p-6 flex items-center justify-center min-h-[200px]">
              <button
                onClick={() => {
                  resetSecondaryForm()
                  setIsCreatingSecondary(true)
                }}
                className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-colors"
              >
                <Plus className="w-6 h-6" />
                <span>AGGIUNGI INDIRIZZO</span>
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Secondary Address Form */}
        {isCreatingSecondary && (
          <div className="bg-white rounded-2xl shadow-apple border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSecondaryId ? 'Modifica indirizzo' : 'Nuovo indirizzo secondario'}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingSecondary(false)
                  resetSecondaryForm()
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSecondaryAddressSubmit} className="space-y-4">
              {secondaryAddressSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    {editingSecondaryId ? 'Indirizzo aggiornato' : 'Indirizzo creato'} con successo!
                  </p>
                </div>
              )}
              
              {secondaryAddressErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{secondaryAddressErrors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etichetta <span className="text-gray-400 text-xs">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.label}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Casa, Ufficio, ecc."
                    disabled={isSubmittingSecondary}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo indirizzo
                  </label>
                  <select
                    value={secondaryAddressForm.address_type}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, address_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isSubmittingSecondary}
                  >
                    <option value="other">Altro</option>
                    <option value="shipping">Spedizione</option>
                    <option value="billing">Fatturazione</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo/Via *
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.street_address}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, street_address: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      secondaryAddressErrors.street_address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmittingSecondary}
                  />
                  {secondaryAddressErrors.street_address && (
                    <p className="mt-1 text-sm text-red-600">{secondaryAddressErrors.street_address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Via aggiuntiva <span className="text-gray-400 text-xs">(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.street_address_2}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, street_address_2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Scala A, Piano 2"
                    disabled={isSubmittingSecondary}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città *
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.city}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, city: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      secondaryAddressErrors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmittingSecondary}
                  />
                  {secondaryAddressErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{secondaryAddressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAP *
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.postal_code}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      secondaryAddressErrors.postal_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={5}
                    disabled={isSubmittingSecondary}
                  />
                  {secondaryAddressErrors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{secondaryAddressErrors.postal_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={secondaryAddressForm.province}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, province: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      secondaryAddressErrors.province ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmittingSecondary}
                  />
                  {secondaryAddressErrors.province && (
                    <p className="mt-1 text-sm text-red-600">{secondaryAddressErrors.province}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazione *
                  </label>
                  <select
                    value={secondaryAddressForm.country}
                    onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, country: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      secondaryAddressErrors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmittingSecondary}
                  >
                    <option value="IT">Italia</option>
                    <option value="FR">Francia</option>
                    <option value="DE">Germania</option>
                    <option value="ES">Spagna</option>
                    <option value="UK">Regno Unito</option>
                    <option value="US">Stati Uniti</option>
                    <option value="NL">Paesi Bassi</option>
                  </select>
                  {secondaryAddressErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{secondaryAddressErrors.country}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note <span className="text-gray-400 text-xs">(opzionale)</span>
                </label>
                <textarea
                  value={secondaryAddressForm.notes}
                  onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  disabled={isSubmittingSecondary}
                  placeholder="Ricezione solo mattina, ecc."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={secondaryAddressForm.is_default}
                  onChange={(e) => setSecondaryAddressForm({ ...secondaryAddressForm, is_default: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  disabled={isSubmittingSecondary}
                />
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                  Imposta come indirizzo predefinito per le spedizioni
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSecondary(false)
                    resetSecondaryForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isSubmittingSecondary}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSecondary}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingSecondary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingSecondaryId ? 'Aggiorna' : 'Crea'} indirizzo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
