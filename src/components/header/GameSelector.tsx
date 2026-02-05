/**
 * GameSelector Component
 * Selezione del gioco (mtg / pk / op) prima di poter usare la ricerca.
 * Ordine UX: prima il gioco, poi la barra di ricerca.
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export type GameSlug = 'mtg' | 'pk' | 'op'

const GAMES: { slug: GameSlug; label: string }[] = [
  { slug: 'mtg', label: 'Magic' },
  { slug: 'pk', label: 'Pokémon' },
  { slug: 'op', label: 'One Piece' },
]

interface GameSelectorProps {
  value: GameSlug | null
  onChange: (slug: GameSlug) => void
  disabled?: boolean
  className?: string
}

export default function GameSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: GameSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const label = value ? GAMES.find((g) => g.slug === value)?.label ?? 'Gioco' : 'Gioco'

  return (
    <div ref={ref} className={`relative flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 min-w-[100px] text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleziona gioco"
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 mt-1 py-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg z-[1002]"
        >
          {GAMES.map((game) => (
            <li key={game.slug} role="option">
              <button
                type="button"
                onClick={() => {
                  onChange(game.slug)
                  setOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  value === game.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                }`}
              >
                {game.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
