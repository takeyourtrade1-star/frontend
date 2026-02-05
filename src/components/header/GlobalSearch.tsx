/**
 * GlobalSearch Component
 * Barra di ricerca globale nell'header che interroga Meilisearch in tempo reale.
 * Esperienza stile CardTrader: dropdown con risultati compatti (thumbnail, nome evidenziato, set, badge gioco).
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  InstantSearch,
  Configure,
  useSearchBox,
  useHits,
  Highlight,
} from 'react-instantsearch'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import type { Hit } from 'instantsearch.js'
import type { SearchHit } from '@/types'
import type { GameSlug } from '@/components/header/GameSelector'

const MEILISEARCH_INDEX = 'cards'
const HITS_PER_PAGE = 8

const host = import.meta.env.VITE_MEILISEARCH_URL
const apiKey = import.meta.env.VITE_MEILISEARCH_API_KEY

const searchClient = host && apiKey
  ? instantMeiliSearch(host, apiKey, {
      placeholderSearch: false,
      primaryKey: 'id',
      meiliSearchParams: {
        attributesToHighlight: ['name'],
        highlightPreTag: '<mark class="bg-amber-200 text-gray-900 rounded px-0.5">',
        highlightPostTag: '</mark>',
      },
    }).searchClient
  : null

const GAME_BADGE_CLASS: Record<SearchHit['game_slug'], string> = {
  mtg: 'bg-violet-500',
  pk: 'bg-amber-400',
  op: 'bg-red-500',
}

function getImageUrl(image: string | null): string | null {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  const base = import.meta.env.VITE_MEILISEARCH_IMAGE_BASE_URL
  return base ? `${base.replace(/\/$/, '')}/${image.replace(/^\//, '')}` : image
}

/** Sottotitolo: "Set Name (CMM) #410" per distinguere ristampe. */
function formatSubtitle(hit: SearchHit): string {
  const parts: string[] = [hit.set_name || '']
  if (hit.set_code) parts.push(`(${hit.set_code})`)
  if (hit.collector_number) parts.push(`#${hit.collector_number}`)
  return parts.filter(Boolean).join(' ')
}

function GlobalSearchHitRow({ hit }: { hit: Hit<SearchHit> }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const imgUrl = getImageUrl(hit.image)
  const showPlaceholder = !imgUrl || imgError

  const handleClick = () => {
    // Meilisearch ID è "mtg_123" → backend si aspetta "123" (id pulito)
    const rawId = hit.id
    const cleanId = rawId.includes('_') ? rawId.split('_')[1] : rawId
    navigate(`/cards/${hit.game_slug}/${cleanId}`)
  }

  const badgeColor = GAME_BADGE_CLASS[hit.game_slug] ?? 'bg-gray-400'

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none rounded transition-colors"
    >
      {/* Thumbnail 40x40 con fallback se image null o errore */}
      <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        {showPlaceholder ? (
          <span className="w-full h-full bg-gray-200 block" aria-hidden />
        ) : (
          <img
            src={imgUrl!}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Titolo (nome carta) + Sottotitolo (Set + Collector Number) */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 truncate [&_mark]:font-semibold">
          <Highlight hit={hit} attribute="name" />
        </div>
        <div className="text-xs text-gray-500 truncate mt-0.5">
          {formatSubtitle(hit)}
        </div>
      </div>

      {/* Badge gioco */}
      <span
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${badgeColor}`}
        title={hit.game_slug === 'mtg' ? 'Magic' : hit.game_slug === 'pk' ? 'Pokémon' : 'One Piece'}
        aria-hidden
      />
    </button>
  )
}

function GlobalSearchInner() {
  const { query, refine, isSearchStalled } = useSearchBox()
  const { hits } = useHits<SearchHit>()
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayHits = hits.slice(0, HITS_PER_PAGE)
  const showDropdown = focused && query.trim().length > 0

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => refine(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {}}
          placeholder="Cerca carta (es. Charizard)..."
          className="w-full h-9 pl-3 pr-9 py-1.5 text-sm border border-gray-200 rounded-lg
                     bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30
                     outline-none transition-colors placeholder:text-gray-400"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {isSearchStalled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" aria-hidden />
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-[1001] max-h-[320px] flex flex-col"
          role="listbox"
        >
          <div className="overflow-y-auto overscroll-contain py-1">
            {isSearchStalled && displayHits.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Ricerca in corso...
              </div>
            ) : displayHits.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Nessuna carta trovata
              </div>
            ) : (
              displayHits.map((hit) => (
                <GlobalSearchHitRow key={hit.id} hit={hit} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface GlobalSearchProps {
  /** Gioco selezionato: la ricerca è abilitata solo dopo aver scelto un gioco. */
  gameSlug: GameSlug | null
  className?: string
}

export default function GlobalSearch({ gameSlug, className = '' }: GlobalSearchProps) {
  const placeholderClass =
    'w-full h-9 flex items-center px-3 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50'

  if (!searchClient) {
    return (
      <div className={`${placeholderClass} ${className}`.trim()}>
        Cerca carta (configura VITE_MEILISEARCH_*)
      </div>
    )
  }

  if (!gameSlug) {
    return (
      <div className={`${placeholderClass} ${className}`.trim()} aria-live="polite">
        Seleziona un gioco per cercare
      </div>
    )
  }

  // Filtro Meilisearch: solo carte del gioco selezionato
  const filter = `game_slug = '${gameSlug}'`

  return (
    <div className={className}>
      <InstantSearch searchClient={searchClient} indexName={MEILISEARCH_INDEX}>
        <Configure hitsPerPage={HITS_PER_PAGE} filter={filter} />
        <GlobalSearchInner />
      </InstantSearch>
    </div>
  )
}
