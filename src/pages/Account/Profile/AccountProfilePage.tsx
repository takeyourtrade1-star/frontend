/**
 * AccountProfilePage Component
 * Profile page displaying user profile information
 */

import { useState, useEffect } from 'react'
import { Edit, Ticket, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { UserProfileData } from '@/types/account'
import { useActivityStatusStore } from '@/store/activityStatusStore'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile, updatePassword } from '@/services/accountService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AccountProfilePage() {
  const { user } = useAuthStore()
  const { activityStatus, updateActivityStatus, initializeActivityStatus } = useActivityStatusStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Inizializza lo stato attività al mount
  useEffect(() => {
    initializeActivityStatus()
  }, [initializeActivityStatus])

  // Dati del profilo caricati dall'API
  const [profileData, setProfileData] = useState<UserProfileData>({
    fullName: user?.username || '',
    accountType: user?.account_type === 'business' ? 'Business' : 'Privato',
    registrationDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : '',
    birthDate: '',
    activityStatus: activityStatus === 'vacanza' ? 'In Vacanza' : 'Sono disponibile',
    mainAddress: {
      name: user?.username || '',
      street: '',
      city: '',
      country: '',
    },
    balance: user?.balance || 0.0,
    email: user?.email || '',
    password: '••••••••',
    phone: user?.telefono ? `${user.phone_prefix || ''} ${user.telefono}`.trim() : '',
    fiscalCode: '',
    birthPlace: '',
  })

  // Carica i dati del profilo dall'API
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const profile = await getUserProfile()
        
        // La risposta dell'API è strutturata come: { profile: {...}, user: {...} }
        const profileDataFromApi = profile?.profile || {}
        const userDataFromApi = profile?.user || {}
        
        // Formatta la data di nascita
        const formatBirthDate = (dateStr: string | null | undefined) => {
          if (!dateStr) return ''
          try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          } catch {
            return dateStr
          }
        }

        // Formatta la data di registrazione
        const formatRegistrationDate = (dateStr: string | null | undefined) => {
          if (!dateStr) return ''
          try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          } catch {
            return dateStr
          }
        }

        // Estrai città e provincia dalla location se disponibile
        const location = profileDataFromApi.location || ''
        const locationParts = location.split(',').map((p: string) => p.trim())
        
        // Costruisci l'indirizzo completo
        let streetAddress = locationParts[0] || ''
        let cityAddress = profileDataFromApi.city || locationParts[2] || ''
        let postalCode = locationParts[3] || ''
        
        // Se cityAddress contiene anche il CAP, estrailo
        if (cityAddress && /^\d{5}/.test(cityAddress)) {
          const parts = cityAddress.split(' ')
          postalCode = parts[0]
          cityAddress = parts.slice(1).join(' ')
        }
        
        // Costruisci il campo city completo con CAP se disponibile
        const cityWithPostal = postalCode && cityAddress 
          ? `${postalCode} ${cityAddress}` 
          : cityAddress || postalCode
        
        // Numero di telefono da data.profile.phone
        const phoneNumber = profileDataFromApi.phone || ''
        
        // Data di registrazione da data.user.created_at o data.user.registration_date
        const registrationDate = userDataFromApi.created_at || userDataFromApi.registration_date || user.created_at || ''
        
        setProfileData({
          fullName: `${user.nome || ''} ${user.cognome || ''}`.trim() || user.username || '',
          accountType: user.account_type === 'business' ? 'Business' : 'Privato',
          registrationDate: formatRegistrationDate(registrationDate),
          birthDate: formatBirthDate(profileDataFromApi.birth_date),
          activityStatus: activityStatus === 'vacanza' ? 'In Vacanza' : 'Sono disponibile',
          mainAddress: {
            name: user.username || '',
            street: streetAddress,
            city: cityWithPostal,
            country: profileDataFromApi.country || user.country || '',
          },
          balance: user.balance || 0.0,
          email: user.email || '',
          password: '••••••••',
          phone: phoneNumber,
          fiscalCode: '',
          birthPlace: profileDataFromApi.city || '',
        })
      } catch (error) {
        // Silently handle profile loading errors
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
    
    // Ascolta gli eventi di aggiornamento profilo
    const handleProfileUpdate = () => {
      loadProfile()
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [user, activityStatus])

  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // Form password
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const activityOptions = ['Sono disponibile', 'Vado in vacanza']

  // Aggiorna il display dello stato quando cambia nello store
  useEffect(() => {
    if (activityStatus) {
      setProfileData(prev => ({
        ...prev,
        activityStatus: activityStatus === 'vacanza' ? 'In Vacanza' : 'Sono disponibile',
      }))
    }
  }, [activityStatus])

  const handleStatusChange = async (newStatus: string) => {
    // Mappa il testo italiano al valore API
    const apiStatus = newStatus === 'Vado in vacanza' ? 'vacanza' : 'disponibile'
    
    // Se sta cambiando a "In Vacanza", mostra conferma
    if (apiStatus === 'vacanza') {
      const confirmed = window.confirm(
        'La tua collezione sarà nascosta e le carte in vendita sospese. Sei sicuro?'
      )
      
      if (!confirmed) {
        setIsEditingStatus(false)
        return
      }
    }

    try {
      setIsUpdatingStatus(true)
      await updateActivityStatus(apiStatus)
      
      // Aggiorna lo stato locale
      setProfileData(prev => ({
        ...prev,
        activityStatus: newStatus,
      }))
      
      setIsEditingStatus(false)
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'aggiornamento dello stato attività')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
    // Rimuovi errore quando l'utente modifica il campo
    if (passwordErrors[field]) {
      setPasswordErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!passwordForm.current_password.trim()) {
      errors.current_password = 'La password attuale è obbligatoria'
    }

    if (!passwordForm.password.trim()) {
      errors.password = 'La nuova password è obbligatoria'
    } else if (passwordForm.password.length < 8) {
      errors.password = 'La nuova password deve essere di almeno 8 caratteri'
    }

    if (!passwordForm.password_confirmation.trim()) {
      errors.password_confirmation = 'La conferma password è obbligatoria'
    } else if (passwordForm.password !== passwordForm.password_confirmation) {
      errors.password_confirmation = 'Le password non corrispondono'
    }

    if (passwordForm.current_password === passwordForm.password) {
      errors.password = 'La nuova password deve essere diversa dalla password attuale'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(false)
    setPasswordErrors({})

    if (!validatePasswordForm()) {
      return
    }

    try {
      setIsUpdatingPassword(true)
      const response = await updatePassword({
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      })

      if (response.success) {
        setPasswordSuccess(true)
        setPasswordForm({
          current_password: '',
          password: '',
          password_confirmation: '',
        })
        setTimeout(() => {
          setIsEditingPassword(false)
          setPasswordSuccess(false)
        }, 2000)
      }
    } catch (error: any) {
      setPasswordErrors({ general: error.message || 'Errore durante l\'aggiornamento della password' })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleOpenTicket = () => {
    // Reindirizza alla pagina di supporto o apre un modal
    window.open('/support', '_blank') || alert('Per modificare email o telefono, apri un ticket di supporto.')
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
      {/* First Box - Profile Information */}
      <div className="bg-white rounded-2xl shadow-apple border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{profileData.fullName}</h2>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Tipo di account */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Tipo di account
            </label>
            <p className="text-lg text-gray-900">{profileData.accountType}</p>
          </div>

          {/* Data di registrazione */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Data di registrazione
            </label>
            <p className="text-lg text-gray-900">{profileData.registrationDate}</p>
          </div>

          {/* Data di nascita */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Data di nascita
            </label>
            <p className="text-lg text-gray-900">{profileData.birthDate}</p>
          </div>

          {/* Stato attività */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-600">
                Stato attività
              </label>
              <button
                onClick={() => setIsEditingStatus(!isEditingStatus)}
                className="flex items-center gap-1 px-3 py-1 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                <Edit className="w-3 h-3" />
                <span>Modifica</span>
              </button>
            </div>
            {!isEditingStatus ? (
              <p className="text-lg text-gray-900">{profileData.activityStatus}</p>
            ) : (
              <div className="space-y-2">
                <select
                  value={profileData.activityStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {isUpdatingStatus && (
                  <p className="text-sm text-gray-600">Aggiornamento in corso...</p>
                )}
                <button
                  onClick={() => setIsEditingStatus(false)}
                  disabled={isUpdatingStatus}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Box - Contact Information */}
      <div className="bg-white rounded-2xl shadow-apple border border-gray-100 p-8">
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
                EMAIL
              </label>
              <p className="text-base text-gray-900">{profileData.email}</p>
            </div>
            <button
              onClick={handleOpenTicket}
              className="ml-4 flex items-center gap-1 px-3 py-1 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200 text-sm"
            >
              <Ticket className="w-4 h-4" />
              <span>Apri un ticket</span>
            </button>
          </div>

          {/* Password */}
          <div className="pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600 uppercase block">
                PASSWORD
              </label>
              {!isEditingPassword ? (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="flex items-center gap-1 px-3 py-1 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifica</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditingPassword(false)
                    setPasswordForm({
                      current_password: '',
                      password: '',
                      password_confirmation: '',
                    })
                    setPasswordErrors({})
                    setPasswordSuccess(false)
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  disabled={isUpdatingPassword}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {!isEditingPassword ? (
              <p className="text-base text-gray-900 mt-1">{profileData.password}</p>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">Password aggiornata con successo!</p>
                  </div>
                )}
                
                {passwordErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">{passwordErrors.general}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password attuale *
                  </label>
                  <input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      passwordErrors.current_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingPassword}
                    required
                  />
                  {passwordErrors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nuova password * <span className="text-gray-400 text-xs">(minimo 8 caratteri)</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={passwordForm.password}
                    onChange={(e) => handlePasswordChange('password', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      passwordErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingPassword}
                    minLength={8}
                    required
                  />
                  {passwordErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma nuova password *
                  </label>
                  <input
                    id="password_confirmation"
                    type="password"
                    value={passwordForm.password_confirmation}
                    onChange={(e) => handlePasswordChange('password_confirmation', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      passwordErrors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isUpdatingPassword}
                    required
                  />
                  {passwordErrors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.password_confirmation}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false)
                      setPasswordForm({
                        current_password: '',
                        password: '',
                        password_confirmation: '',
                      })
                      setPasswordErrors({})
                      setPasswordSuccess(false)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={isUpdatingPassword}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      'Aggiorna password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
                NUMERO DI TELEFONO
              </label>
              <p className="text-base text-gray-900">{profileData.phone || '-'}</p>
            </div>
            <button
              onClick={handleOpenTicket}
              className="ml-4 flex items-center gap-1 px-3 py-1 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200 text-sm"
            >
              <Ticket className="w-4 h-4" />
              <span>Apri un ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
