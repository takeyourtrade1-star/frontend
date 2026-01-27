/**
 * UserProfileTab Component
 * Tab per gestione profilo utente
 */

import { useState, useEffect } from 'react'
import { Edit, Mail, Phone, Calendar, MapPin, Building, CreditCard, User, FileText } from 'lucide-react'
import { fetchUserProfile, updateUserProfile } from '@/services/accountService'
import type { UserProfileData } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function UserProfileTab() {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await fetchUserProfile()
      setProfile(data)
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleSave = async () => {
    try {
      if (profile) {
        await updateUserProfile(profile)
        setIsEditMode(false)
      }
    } catch (error) {
      // Silently handle saving errors
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-12">Nessun profilo trovato</div>
  }

  const InfoSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-500" />
          {title}
        </h3>
        <button
          onClick={handleEdit}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          aria-label="Modifica"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <InfoSection title="Dati Personali" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <p className="text-gray-900">{profile.username}</p>
          </div>
          {profile.nome && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <p className="text-gray-900">{profile.nome}</p>
            </div>
          )}
          {profile.cognome && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
              <p className="text-gray-900">{profile.cognome}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {profile.email}
            </p>
          </div>
          {profile.date_of_birth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data di Nascita</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {profile.date_of_birth}
              </p>
            </div>
          )}
        </div>
      </InfoSection>

      {/* Contact Info */}
      <InfoSection title="Contatti" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paese</label>
            <p className="text-gray-900">{profile.country}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <p className="text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {profile.phone_prefix} {profile.telefono}
            </p>
          </div>
        </div>
      </InfoSection>

      {/* Address */}
      <InfoSection title="Indirizzo" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.address_street && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Via</label>
              <p className="text-gray-900">{profile.address_street}</p>
            </div>
          )}
          {profile.address_city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <p className="text-gray-900">{profile.address_city}</p>
            </div>
          )}
          {profile.address_zip && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <p className="text-gray-900">{profile.address_zip}</p>
            </div>
          )}
          {profile.address_country && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazione</label>
              <p className="text-gray-900">{profile.address_country}</p>
            </div>
          )}
        </div>
      </InfoSection>

      {/* Banking */}
      <InfoSection title="Dati Bancari" icon={CreditCard}>
        {profile.iban && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <p className="text-gray-900 font-mono">{profile.iban}</p>
          </div>
        )}
      </InfoSection>

      {/* Seller Settings */}
      <InfoSection title="Impostazioni Venditore" icon={Building}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Account</label>
            <p className="text-gray-900">
              {profile.seller_type === 'private' ? 'Privato' : profile.seller_type === 'commercial' ? 'Commerciale' : '-'}
            </p>
          </div>
          {profile.seller_country && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paese Vendita</label>
              <p className="text-gray-900">{profile.seller_country}</p>
            </div>
          )}
        </div>
      </InfoSection>
    </div>
  )
}




