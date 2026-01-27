/**
 * SynchronizationPage
 * UI placeholder for CardTrader synchronization workflow
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCcw,
  ShieldCheck,
  Zap,
  CloudOff,
  AlertTriangle,
  ExternalLink,
  Copy,
  Lock,
  CheckCircle2,
} from 'lucide-react'

export default function SynchronizationPage() {
  // TODO: replace with real API state
  const [previewActive, setPreviewActive] = useState(false)
  const isSyncActive = previewActive
  const [jwtToken, setJwtToken] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const webhookUrl = 'https://api.takeyourtrade.com/integrations/cardtrader/webhook/<tuo-id>'

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  const handleTogglePreview = () => {
    setPreviewActive((prev) => !prev)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500 font-semibold uppercase text-xs tracking-wide">
              <RefreshCcw className="w-4 h-4" />
              CardTrader Sync
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Configura la sincronizzazione in pochi passi
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Collega il tuo account CardTrader per importare automaticamente stock e ristampe supportate. Poche informazioni, nessuna configurazione complessa.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePreview}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-500 transition-all"
            >
              {isSyncActive ? 'Mostra configurazione' : 'Anteprima sincronizzazione attiva'}
            </button>
            <Link
              to="/account/synchronization/terms"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Termini sincronizzazione
            </Link>
          </div>
        </div>

        <div className="mt-6 md:mt-8">
          {isSyncActive ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Stato</p>
                  <div className="flex items-center gap-2 mt-2 text-green-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Online
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Aggiornamenti in tempo reale</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Webhook collegato</p>
                  <p className="text-xs text-gray-700 break-all mt-2">{webhookUrl}</p>
                  <p className="text-xs text-gray-500 mt-3">Ultimo evento ricevuto: 2 ore fa</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Token CardTrader</p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">••••••••••••••••</p>
                  <p className="text-xs text-gray-500 mt-3">Rigenerabile solo da CardTrader</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Se devi rigenerare il token, disattiva prima la sincronizzazione da qui per eliminare token e webhook in modo sicuro.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold shadow-sm hover:bg-red-600 transition-all"
                >
                  Rimuovi sincronizzazione
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">JWT token CardTrader</label>
                  <input
                    type="text"
                    value={jwtToken}
                    onChange={(event) => setJwtToken(event.target.value)}
                    placeholder="Incolla qui il token generato dal tuo account CardTrader"
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Recuperalo da CardTrader &gt; Developer &gt; API Tokens.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">Webhook TakeYourTrade</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      className="flex-1 h-12 px-4 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 h-12 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-500 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      {copyStatus === 'copied' ? 'Copiato' : 'Copia'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Incollalo su CardTrader &gt; Developer &gt; Webhooks per gli aggiornamenti automatici.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <span>Non revocare il token dal portale CardTrader mentre la sincronizzazione è attiva: bloccherebbe l’aggiornamento automatico.</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link
                  to="/account/synchronization/terms"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-500 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Leggi come funziona la sincronizzazione
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-sm hover:bg-orange-600 transition-all"
                >
                  Connetti con CardTrader
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <div className="bg-orange-100 text-orange-600 rounded-lg p-2">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Aggiornamenti smart</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stock e prezzi compatibili vengono sincronizzati senza azioni manuali.
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <div className="bg-orange-100 text-orange-600 rounded-lg p-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ristampe dedicate</h3>
            <p className="text-sm text-gray-600 mt-1">
              Le carte non presenti su CardTrader restano gestite solo in TakeYourTrade.
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <div className="bg-orange-100 text-orange-600 rounded-lg p-2">
            <CloudOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Foto sotto controllo</h3>
            <p className="text-sm text-gray-600 mt-1">
              Le immagini restano sul tuo account: decidi tu se aggiornarle.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Sintesi rapida</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Importiamo automaticamente stock e prezzi supportati dal tuo account CardTrader.</li>
          <li>• Alcune ristampe esclusive rimangono disponibili solo in TakeYourTrade e non vengono esportate.</li>
          <li>• Le foto non vengono sincronizzate per evitare sovrascritture indesiderate.</li>
          <li>• Token e webhook possono essere revocati direttamente da questa pagina quando vuoi.</li>
        </ul>
        <Link
          to="/account/synchronization/terms"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          <ExternalLink className="w-4 h-4" />
          Leggi i termini completi della sincronizzazione
        </Link>
      </div>
    </div>
  )
}


