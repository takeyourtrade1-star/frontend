/**
 * HealthPage
 * Pagina di test per verificare la connessione frontend ↔ backend
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/lib/authApi'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ExternalLink } from 'lucide-react'
import type { HealthCheck } from '@/types'

export default function HealthPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HealthCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Usa authApi per puntare al microservizio Auth su AWS
      const response = await authApi.get<HealthCheck>('/health')
      setResult(response.data || null)
    } catch (err: any) {
      setError(err.message || 'Errore durante il test di connessione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏥 Health Check</h1>
          <p className="text-gray-600 mb-4">
            Testa la connessione tra frontend React e backend Laravel
          </p>
          <Link
            to="/test-api"
            className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <span>Test Microservizio Autenticazione</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Test Card */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center min-w-[200px]"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Testing...</span>
                </>
              ) : (
                '🚀 Test Connessione'
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <h3 className="text-lg font-semibold text-green-900">✅ Connessione OK</h3>
              </div>
              <pre className="bg-white rounded-lg p-4 text-sm text-gray-800 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-red-900">❌ Errore</h3>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">ℹ️ Informazioni</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>API Base:</strong> {import.meta.env.VITE_API_BASE}
            </li>
            <li>
              <strong>Endpoint:</strong> GET /api/health
            </li>
            <li>
              <strong>Nota:</strong> Assicurati che il backend Laravel sia in esecuzione su{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:8000</code>
            </li>
          </ul>
        </div>

        {/* Backend Setup Instructions */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Setup Backend</h3>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm font-mono">
            <p className="text-gray-400"># Avvia il backend Laravel</p>
            <p className="text-green-400">cd main</p>
            <p className="text-green-400">php artisan serve</p>
            <p className="mt-4 text-gray-400"># Il backend sarà disponibile su:</p>
            <p className="text-blue-400">http://localhost:8000</p>
          </div>
        </div>
      </div>
    </div>
  )
}

