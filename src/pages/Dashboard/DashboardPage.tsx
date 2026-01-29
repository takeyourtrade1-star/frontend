/**
 * DashboardPage
 * Dashboard principale per utenti autenticati
 */

import { useAuthStore } from '@/store/authStore'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Languages,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner'
import CompleteProfileBanner from '@/components/auth/CompleteProfileBanner'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { selectedLang, isLangLoading } = useLanguage()
  // Lingua preferita da /api/auth/me (user.preferences.language) — backend non espone GET /profile/language
  const languageFromMe = user?.preferences?.language ?? null

  const stats = [
    {
      title: 'Carte in Collezione',
      value: '0',
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Vendite Attive',
      value: '0',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Scambi in Corso',
      value: '0',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Carrello',
      value: formatPrice(0),
      icon: ShoppingCart,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Complete Profile Banner */}
        <CompleteProfileBanner />

        {/* Debug Language Info */}
        <div className="mb-6 card p-4 bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">Debug Lingua Preferita</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Stato Autenticazione:</span>
              {isAuthenticated ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Autenticato
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  Non autenticato
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Lingua Corrente (Context):</span>
              <span className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">
                {selectedLang}
              </span>
              {isLangLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Lingua (da /me):</span>
              {languageFromMe ? (
                <span className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-green-600">
                  {languageFromMe}
                </span>
              ) : (
                <span className="text-gray-500 italic">Non disponibile</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Match:</span>
              {languageFromMe ? (
                selectedLang === languageFromMe ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Le lingue corrispondono ✓
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    Le lingue NON corrispondono (Context: {selectedLang} vs /me: {languageFromMe})
                  </span>
                )
              ) : (
                <span className="text-gray-500 italic">Non confrontabile</span>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Benvenuto, {user?.username}! 👋
          </h1>
          <p className="text-gray-600">
            Ecco un riepilogo della tua attività
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card p-6 hover:shadow-apple-md transition-all duration-300 card-hover-lift"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ultime Vendite */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Ultime Vendite
              </h2>
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nessuna vendita recente</p>
            </div>
          </div>

          {/* Ultimi Acquisti */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Ultimi Acquisti
              </h2>
              <ArrowDownRight className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nessun acquisto recente</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Azioni Rapide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="btn-outline py-3">
              Aggiungi Carte
            </button>
            <button className="btn-outline py-3">
              Cerca Carte
            </button>
            <button className="btn-outline py-3">
              Esplora Scambi
            </button>
            <button className="btn-outline py-3">
              Vendi Prodotti
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

