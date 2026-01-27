/**
 * LanguageSelectorBottomBar Component
 * Sidebar fissa in basso per selettore lingua su mobile
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronUp, Loader2 } from 'lucide-react'
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext'

export default function LanguageSelectorBottomBar() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { selectedLang, setSelectedLang, availableLangs, isLangLoading } = useLanguage()

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1001] md:hidden">
      {/* Barra principale */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="px-4 py-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            disabled={isLangLoading}
          >
            <span className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Lingua:</span>
              <span className="font-semibold">{selectedLang.toUpperCase()}</span>
            </span>
            {isLangLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
            )}
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLang(lang)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedLang === lang
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{LANGUAGE_NAMES[lang] || lang.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{lang.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

