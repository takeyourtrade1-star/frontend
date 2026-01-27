/**
 * CompleteProfileBanner
 * Banner che appare nella dashboard se il profilo non è completato
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile, completeProfile } from '@/services/accountService'
import { User, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface ProfileData {
  birth_date?: string | null
  city?: string | null
  location?: string | null
  country?: string | null
}

export default function CompleteProfileBanner() {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    birth_date: '',
    city: '',
    address: '',
    street: '',
    postal_code: '',
    province: '',
    country: 'IT',
  })

  // Verifica se il profilo è completato
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      // Mostra il banner solo se l'email è verificata
      const isEmailVerified = user?.verified === true && user?.email_verified_at !== null
      if (!isEmailVerified) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await getUserProfile()
        const profileData: ProfileData = profile?.profile || profile || {}
        
        const isComplete = !!(
          profileData.birth_date &&
          profileData.city &&
          profileData.location &&
          profileData.country
        )
        
        setProfileComplete(isComplete)
      } catch (error) {
        // In caso di errore, mostra comunque il banner per sicurezza
        setProfileComplete(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkProfile()
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Rimuovi errore quando l'utente modifica il campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    try {
      // Prepara i dati da inviare (rimuovi street se vuoto)
      const submitData: any = {
        birth_date: formData.birth_date,
        city: formData.city.trim(),
        address: formData.address.trim(),
        postal_code: formData.postal_code.trim(),
        province: formData.province.trim(),
        country: formData.country,
      }

      // Aggiungi street solo se non è vuoto
      if (formData.street.trim()) {
        submitData.street = formData.street.trim()
      }

      const response = await completeProfile(submitData)

      if (response.success) {
        setSuccess(true)
        setProfileComplete(true)
        
        // Ricarica il profilo per aggiornare i dati nell'app
        try {
          const updatedProfile = await getUserProfile()
          // Il profilo è già aggiornato nel backend, il banner si nasconderà automaticamente
          
          // Emetti evento per aggiornare altre pagine
          window.dispatchEvent(new Event('profileUpdated'))
        } catch (error) {
          // Silently handle profile reload errors
        }
        
        setTimeout(() => {
          setShowModal(false)
          setSuccess(false)
        }, 2000)
      }
    } catch (error: any) {
      // Gestione errori di validazione
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        setErrors({ general: [error.message || 'Errore durante il completamento del profilo'] })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Se il profilo è già completato, sta caricando, l'email non è verificata o non c'è utente, non mostrare il banner
  const isEmailVerified = user?.verified === true && user?.email_verified_at !== null
  
  if (isLoading || profileComplete || !user || !isEmailVerified) {
    return null
  }

  return (
    <>
      {/* Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Completa le informazioni del tuo profilo
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Aggiungi le informazioni mancanti per completare il tuo profilo e utilizzare tutte le funzionalità della piattaforma.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Completa profilo
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ml-4 flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal con form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Completa il tuo profilo</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setErrors({})
                  setSuccess(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Profilo completato!</h3>
                <p className="text-gray-600">Le tue informazioni sono state salvate con successo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Errori generali */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{errors.general[0]}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data di nascita */}
                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Data di nascita *
                    </label>
                    <input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      className={`input-field ${errors.birth_date ? 'border-red-300' : ''}`}
                      required
                      disabled={isSubmitting}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.birth_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.birth_date[0]}</p>
                    )}
                  </div>

                  {/* Città */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Città *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`input-field ${errors.city ? 'border-red-300' : ''}`}
                      placeholder="Milano"
                      required
                      disabled={isSubmitting}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city[0]}</p>
                    )}
                  </div>
                </div>

                {/* Indirizzo */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo/Via *
                  </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`input-field ${errors.address ? 'border-red-300' : ''}`}
                      placeholder="Via Roma 1"
                      required
                      disabled={isSubmitting}
                    />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address[0]}</p>
                  )}
                </div>

                {/* Via aggiuntiva (opzionale) */}
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Via aggiuntiva <span className="text-gray-400 text-xs">(opzionale)</span>
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="input-field"
                    placeholder="Scala A, Piano 2"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CAP */}
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                      CAP *
                    </label>
                    <input
                      id="postal_code"
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className={`input-field ${errors.postal_code ? 'border-red-300' : ''}`}
                      placeholder="20100"
                      maxLength={5}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.postal_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.postal_code[0]}</p>
                    )}
                  </div>

                  {/* Provincia */}
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia *
                    </label>
                    <input
                      id="province"
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className={`input-field ${errors.province ? 'border-red-300' : ''}`}
                      placeholder="Milano"
                      required
                      disabled={isSubmitting}
                    />
                    {errors.province && (
                      <p className="mt-1 text-sm text-red-600">{errors.province[0]}</p>
                    )}
                  </div>

                  {/* Nazione */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Nazione *
                    </label>
                    <select
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`input-field ${errors.country ? 'border-red-300' : ''}`}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="IT">Italia</option>
                      <option value="FR">Francia</option>
                      <option value="DE">Germania</option>
                      <option value="ES">Spagna</option>
                      <option value="UK">Regno Unito</option>
                      <option value="US">Stati Uniti</option>
                      <option value="NL">Paesi Bassi</option>
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country[0]}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setErrors({})
                    }}
                    className="flex-1 btn-outline"
                    disabled={isSubmitting}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      'Salva'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

