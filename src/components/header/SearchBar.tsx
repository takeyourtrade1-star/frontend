/**
 * SearchBar Component
 * Global Search Bar rifondata: ricerca Server-Side su Meilisearch (react-instantsearch).
 * Nessuna dipendenza da file JSON locali per le traduzioni.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
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

const MEILISEARCH_INDEX = 'cards'
const HITS_MAX = 8
const MIN_QUERY_LENGTH = 2

const host = import.meta.env.VITE_MEILISEARCH_URL
const apiKey = import.meta.env.VITE_MEILISEARCH_API_KEY

const searchClient =
  host && apiKey
    ? instantMeiliSearch(host, apiKey, {
        placeholderSearch: false,
        primaryKey: 'id',
        meiliSearchParams: {
          attributesToHighlight: ['name'],
          highlightPreTag:
            '<mark class="bg-amber-200 text-gray-900 rounded px-0.5">',
          highlightPostTag: '</mark>',
        },
      }).searchClient
    : null

const GAME_BADGE_CLASS: Record<SearchHit['game_slug'], string> = {
  mtg: 'bg-violet-500',  // Viola/Blu
  pk: 'bg-amber-400',    // Giallo
  op: 'bg-red-500',     // Rosso
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

function SearchHitRow({
  hit,
  onSelect,
}: {
  hit: Hit<SearchHit>
  onSelect: (hit: Hit<SearchHit>) => void
}) {
  const [imgError, setImgError] = useState(false)
  const imgUrl = getImageUrl(hit.image)
  const showPlaceholder = !imgUrl || imgError
  const badgeClass = GAME_BADGE_CLASS[hit.game_slug] ?? 'bg-gray-400'

  return (
    <button
      type="button"
      onClick={() => onSelect(hit)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none rounded transition-colors"
    >
      {/* Thumbnail 40x40 */}
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
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${badgeClass}`}
        title={
          hit.game_slug === 'mtg'
            ? 'Magic'
            : hit.game_slug === 'pk'
              ? 'Pokémon'
              : 'One Piece'
        }
        aria-hidden
      />
    </button>
  )
}

function SearchBarInner() {
  const navigate = useNavigate()
  const { query, refine, isSearchStalled } = useSearchBox()
  const { hits } = useHits<SearchHit>()
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayHits = hits.slice(0, HITS_MAX)
  const showDropdown =
    focused && query.trim().length > MIN_QUERY_LENGTH

  const handleSelect = (hit: Hit<SearchHit>) => {
    navigate(`/cards/${hit.game_slug}/${hit.id}`)
    refine('')
    setFocused(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[800px] md:max-w-[600px] mx-auto"
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => refine(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Cerca carta (es. Charizard)..."
          className="w-full h-10 pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg
                     bg-gray-50 focus:bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30
                     outline-none transition-colors placeholder:text-gray-400"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {isSearchStalled && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-[1001] max-h-[320px] flex flex-col"
          role="listbox"
        >
          <div className="overflow-y-auto overscroll-contain py-1">
            {isSearchStalled && displayHits.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Ricerca in corso...
              </div>
            ) : displayHits.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                Nessuna carta trovata
              </div>
            ) : (
              displayHits.map((hit) => (
                <SearchHitRow
                  key={hit.id}
                  hit={hit}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchBar() {
  if (!searchClient) {
    return (
      <div
        className="w-full bg-white border-b border-gray-100 flex justify-center items-center py-2 sticky z-[999]"
        style={{
          top: '70px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="w-full max-w-[800px] h-10 flex items-center px-4 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
          Cerca carta (configura VITE_MEILISEARCH_URL e VITE_MEILISEARCH_API_KEY)
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full bg-white border-b border-gray-100 flex justify-center items-center py-2 sticky z-[999]"
      style={{
        top: '70px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="w-full px-4 md:px-6 md:w-[90%] md:max-w-[1100px] flex items-center justify-center">
        <InstantSearch searchClient={searchClient} indexName={MEILISEARCH_INDEX}>
          <Configure hitsPerPage={HITS_MAX} />
          <SearchBarInner />
        </InstantSearch>
      </div>
    </div>
  )
}
