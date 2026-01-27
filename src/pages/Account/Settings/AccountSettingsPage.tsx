/**
 * AccountSettingsPage Component
 * Settings page with various configuration options
 */

import { useState } from 'react'
import { Languages, Mail, Home, UserX, Globe, Filter, ArrowUpDown, X } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext'

export default function AccountSettingsPage() {
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage()

  const settings = [
    {
      icon: Languages,
      title: 'Impostazioni lingua',
      description: 'Imposta la lingua della pagina e dei nomi delle carte.',
      onClick: () => setShowLanguageModal(true),
    },
    {
      icon: Mail,
      title: 'Le mie opzioni email',
      description: 'Filtra le mail automatiche che vuoi ricevere.',
      onClick: () => {
        // TODO: Implementare modal opzioni email
        alert('Funzionalità in arrivo')
      },
    },
    {
      icon: Home,
      title: 'Home Page',
      description: 'Gestisci come mostrare la Home Page quando ti connetti',
      onClick: () => {
        // TODO: Implementare modal home page
        alert('Funzionalità in arrivo')
      },
    },
    {
      icon: UserX,
      title: 'Lista utenti bloccati',
      description: 'Scegli con chi non vuoi interagire.',
      onClick: () => {
        // TODO: Implementare lista utenti bloccati
        alert('Funzionalità in arrivo')
      },
    },
    {
      icon: Globe,
      title: 'Nazioni alle quali spedisci',
      description: 'Seleziona i paesi dove spedisci ed escludi quelli dove non vuoi spedire.',
      onClick: () => {
        // TODO: Implementare modal nazioni spedizione
        alert('Funzionalità in arrivo')
      },
    },
    {
      icon: Filter,
      title: 'Filtri personalizzati',
      description: 'Imposta i filtri da applicare alle pagine dei prodotti e agli inventari degli utenti.',
      onClick: () => {
        // TODO: Implementare modal filtri personalizzati
        alert('Funzionalità in arrivo')
      },
    },
    {
      icon: ArrowUpDown,
      title: 'Ordina articoli',
      description: 'Imposta in quale ordine vuoi visualizzare gli articoli nelle spedizioni.',
      onClick: () => {
        // TODO: Implementare modal ordina articoli
        alert('Funzionalità in arrivo')
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Help Link */}
      <div className="flex justify-end">
        <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
          Hai bisogno di aiuto?
        </a>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl shadow-apple border border-gray-100">
        <div className="divide-y divide-gray-200">
          {settings.map((setting, index) => (
            <button
              key={index}
              onClick={setting.onClick}
              className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-orange-50 rounded-lg">
                <setting.icon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{setting.title}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Language Settings Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-orange-50 rounded-lg">
                  <Languages className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Impostazioni Lingua</h2>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Current Language */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Seleziona la lingua preferita per l'interfaccia e i nomi delle carte.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Lingua attuale: <span className="font-semibold text-gray-900">{LANGUAGE_NAMES[selectedLang] || selectedLang.toUpperCase()}</span>
              </div>
            </div>

            {/* Language Options */}
            <div className="space-y-2">
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLang(lang)
                    // Chiudi il modal dopo un breve delay per mostrare il feedback
                    setTimeout(() => {
                      setShowLanguageModal(false)
                    }, 300)
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedLang === lang
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedLang === lang ? 'bg-orange-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-base font-medium text-gray-900">
                      {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                    </span>
                  </div>
                  {selectedLang === lang && (
                    <div className="text-orange-600 font-semibold text-sm">✓ Selezionata</div>
                  )}
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La lingua selezionata verrà salvata nel tuo profilo e utilizzata in tutte le sessioni future.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
