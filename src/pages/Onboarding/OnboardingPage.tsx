/**
 * OnboardingPage
 * Mandatory 2-step wizard for first-time users: Language → Theme
 */

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext'
import { authApi } from '@/lib/authApi'
import { Globe, Sun, Moon, Monitor, Loader2, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const THEMES = [
  { id: 'light' as const, label: 'Chiaro', icon: Sun, desc: 'Sfondo chiaro', bg: 'bg-white', border: 'border-gray-200' },
  { id: 'dark' as const, label: 'Scuro', icon: Moon, desc: 'Sfondo scuro', bg: 'bg-gray-900', border: 'border-gray-700' },
  { id: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Segue il dispositivo', bg: 'bg-gradient-to-r from-white to-gray-900', border: 'border-gray-400' },
]

export default function OnboardingPage() {
  const { user, updateUserPreferences } = useAuthStore()
  const { availableLangs, setSelectedLang } = useLanguage()
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<string>(user?.preferences?.language ?? 'en')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user?.preferences?.theme ?? 'system')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFinish = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      try {
        // Se manca is_onboarding_completed: true, il backend non sa che l'onboarding è finito → loop redirect
        await authApi.patch('/api/users/preferences', {
          theme,
          language,
          is_onboarding_completed: true,
        })
      } catch (apiErr: any) {
        if (apiErr.response?.status === 404) {
          // Endpoint non implementato: salva solo in locale e procedi
        } else {
          throw apiErr
        }
      }
      // Aggiorna subito lo store locale così ProtectedRoute non reindirizza più a /onboarding
      updateUserPreferences({ theme, language, is_onboarding_completed: true })
      setSelectedLang(language)
      toast.success('Preferenze salvate. Benvenuto in Dashboard!')
      window.location.replace('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail?.[0]?.msg ?? err.response?.data?.message ?? err.message ?? 'Errore di salvataggio'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>Step {step} di 2</span>
              <span aria-hidden>·</span>
              <span>{step === 1 ? 'Lingua' : 'Tema'}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 1 ? 'Scegli la lingua' : 'Scegli il tema'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {step === 1
                ? 'Seleziona la lingua per l\'interfaccia e i contenuti.'
                : 'Scegli come vuoi visualizzare l\'app.'}
            </p>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <Globe className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Lingua</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(availableLangs.length ? availableLangs : ['en', 'it', 'fr', 'de', 'es', 'pt']).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all
                        ${language === lang
                          ? 'border-orange-500 bg-orange-50 text-orange-800'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}
                      `}
                    >
                      <span>{LANGUAGE_NAMES[lang] ?? lang}</span>
                      {language === lang && <Check className="w-5 h-5 text-orange-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <Sun className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Tema</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {THEMES.map((t) => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`
                          flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all
                          ${theme === t.id
                            ? 'border-orange-500 bg-orange-50 text-orange-800'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}
                        `}
                      >
                        <div className={`w-12 h-12 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-sm text-gray-500">{t.desc}</div>
                        </div>
                        {theme === t.id && <Check className="w-5 h-5 text-orange-600 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Indietro
                </button>
              )}
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
                >
                  Avanti
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      Fine e vai alla Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
