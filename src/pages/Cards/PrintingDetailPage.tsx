/**
 * PrintingDetailPage
 * URL canonico: /cards/:game_slug/:id (nessun redirect).
 * - game_slug: identifica il gioco (mtg | pk | op) → quale API chiamare.
 * - id: ID numerico della ristampa nel DB (es. 500), già pulito (senza prefisso mtg_).
 * La pagina usa game_slug + id per caricare dettaglio e prezzi di mercato di quella ristampa.
 */

import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrintingDetailPage() {
  const { game_slug, id } = useParams<{ game_slug: string; id: string }>()

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">ID ristampa mancante.</p>
        <Link to="/" className="ml-4 text-orange-500 hover:underline">Torna alla home</Link>
      </div>
    )
  }

  // Logica per gioco: game_slug === 'mtg' → API Magic; 'op' → API One Piece; 'pk' → API Pokémon.
  // TODO: GET /api/cards/:game_slug/:id (o GET /api/printings/:id) con id numerico.

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </Link>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Dettaglio ristampa
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            ID ristampa: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{id}</code>
            {game_slug && (
              <>
                {' '}
                · Gioco: <span className="capitalize">{game_slug}</span>
              </>
            )}
          </p>
          <p className="text-sm text-gray-400">
            I dati di mercato per questa versione verranno caricati qui quando l’API sarà disponibile.
          </p>
        </div>
      </div>
    </div>
  )
}
