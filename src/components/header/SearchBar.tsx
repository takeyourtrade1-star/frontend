/**
 * SearchBar Component
 * Barra di ricerca con autocomplete multilingua ibrida per Magic: The Gathering
 * Aggiornato secondo la nuova struttura API autocomplete con ricerca ibrida
 */

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react'
import { Search, Loader2, X, ChevronDown, Package, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useHybridAutocomplete } from '@/hooks/useHybridAutocomplete'
import { useLanguage, LANGUAGE_NAMES } from '@/contexts/LanguageContext'
import type { AutocompleteResultWithTranslation } from '@/hooks/useHybridAutocomplete'
import type { Set } from '@/config/searchApi'

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
  const [hoveredSetIconIndex, setHoveredSetIconIndex] = useState<number | null>(null)
  const [mobileImageOpen, setMobileImageOpen] = useState<{ url: string; name: string } | null>(null)
  
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  // Usa il LanguageContext
  const { selectedLang, setSelectedLang, availableLangs, isLangLoading, fuseDictionary, idToPreferredName } = useLanguage()

  // Usa il nuovo hook per autocomplete ibrido con debounce ottimizzato
  const { results, loading, error, cached, translatedName } = useHybridAutocomplete(searchQuery, {
    debounceMs: 400, // Aumentato per ridurre le richieste e evitare rate limiting
    minLength: 2,
  })

  // Limita i risultati a 15 per performance
  const displayResults = results.slice(0, 15)
  const hasResults = displayResults.length > 0

  // Apri dropdown quando ci sono risultati
  useEffect(() => {
    if (hasResults && searchQuery.length >= 2) {
      setIsOpen(true)
    }
  }, [hasResults, searchQuery])

  // Gestione ricerca principale con logica ibrida Fuse.js
  const handleSearch = useCallback((query?: string) => {
    const searchTerm = query || searchQuery.trim()
    if (!searchTerm || searchTerm.length < 2) return

    // Chiudi i suggerimenti quando si esegue la ricerca
    setIsOpen(false)
    setActiveIndex(-1)
    
    // Nascondi la tastiera su mobile (iOS/Android)
    inputRef.current?.blur()

    // SE LA LINGUA È INGLESE (O NON C'È FUZZY) -> USA LA RICERCA NORMALE
    if (selectedLang === 'en' || !fuseDictionary) {
      navigate(`/search?term=${encodeURIComponent(searchTerm)}&lang=en`)
      return
    }

    // SE LA LINGUA È TRADOTTA -> USA LA LOGICA FUZZY
    const fuseResults = fuseDictionary.search(searchTerm, { limit: 20 })

    if (fuseResults.length === 0) {
      // FALLBACK: Non ho trovato traduzioni, cerco il termine in inglese
      navigate(`/search?term=${encodeURIComponent(searchTerm)}&lang=en`)
    } else {
      // TRADUZIONE RIUSCITA:
      // Estrai gli Oracle IDs unici
      const oracleIdsSet = new Set<string>()
      fuseResults.forEach(result => {
        oracleIdsSet.add(result.item.id)
      })
      const oracleIds = Array.from(oracleIdsSet).join(',')

      // Naviga alla pagina risultati passando gli ID
      navigate(`/search?ids=${oracleIds}&lang=${selectedLang}&originalTerm=${encodeURIComponent(searchTerm)}`)
    }
  }, [searchQuery, navigate, selectedLang, fuseDictionary])

  // Gestione click su risultato (carta o set)
  const handleResultClick = useCallback((result: AutocompleteResultWithTranslation) => {
    if (result.type === 'set') {
      // Naviga al dettaglio set
      const set = result as Set & { type: 'set' }
      if (set.code) {
        navigate(`/set/${set.code}`)
        setIsOpen(false)
        setSearchQuery('')
      }
    } else {
      // È una carta
      const printing = result as any
      if (printing.oracle_id && printing.printing_id) {
        // Passa sia oracle_id che printing_id come query parameter
        const url = `/card/${printing.oracle_id}?printing_id=${printing.printing_id}`
        navigate(url)
        setIsOpen(false)
        setSearchQuery('')
      } else if (printing.oracle_id) {
        // Fallback se printing_id non è disponibile
        const url = `/card/${printing.oracle_id}`
        navigate(url)
        setIsOpen(false)
        setSearchQuery('')
      }
    }
  }, [navigate])

  // Gestione tasti
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Nascondi la tastiera immediatamente
      inputRef.current?.blur()
      if (isOpen && activeIndex >= 0 && displayResults[activeIndex]) {
        handleResultClick(displayResults[activeIndex])
      } else {
        handleSearch()
      }
      return
    }

    if (!isOpen || displayResults.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, displayResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Gestione click fuori per chiudere dropdown e lang selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Chiudi dropdown suggerimenti
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }

      // Chiudi dropdown lingua
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(target)
      ) {
        setIsLangDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Gestione focus
  const handleFocus = () => {
    if (hasResults && searchQuery.length >= 2) {
      setIsOpen(true)
    }
  }

  // Gestione clear
  const handleClear = () => {
    setSearchQuery('')
    setActiveIndex(-1)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Funzione per chiudere l'overlay mobile mantenendo i suggerimenti aperti
  const handleCloseMobileImage = () => {
    setMobileImageOpen(null)
    // Assicurati che i suggerimenti rimangano aperti se c'è ancora una query
    if (searchQuery.length >= 2 && hasResults) {
      setIsOpen(true)
    }
  }

  // Determina se mostrare il dropdown
  const showDropdown = isOpen && searchQuery.length >= 2 && (loading || hasResults || error)

  return (
    <div 
      className="w-full bg-white border-b border-gray-100 flex justify-center items-center py-2 sticky z-[999]"
      style={{
        top: '70px', // Subito sotto l'header fisso
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'visible', // Cambiato da 'hidden' a 'visible' per permettere al dropdown di essere visibile
      }}
    >
      <div className="w-full px-4 md:px-6 md:w-[90%] md:max-w-[1100px] flex items-center gap-2 md:gap-3 flex-row justify-center" style={{ position: 'relative', overflow: 'visible' }}>
        {/* Language Selector Dropdown - Solo desktop */}
        <div className="relative flex-shrink-0 hidden md:block" ref={langDropdownRef} style={{ zIndex: 1001, overflow: 'visible' }}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium text-gray-600 min-w-[100px] justify-between"
            disabled={isLangLoading}
            style={{
              borderWidth: '0.5px',
            }}
          >
            <span>{LANGUAGE_NAMES[selectedLang] || selectedLang.toUpperCase()}</span>
            {isLangLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <ChevronDown className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Language Dropdown Menu */}
          {isLangDropdownOpen && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-[120px] max-h-60" 
              style={{ 
                position: 'absolute',
                zIndex: 1002,
                overflowY: 'auto',
                overflowX: 'visible'
              }}
            >
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLang(lang)
                    setIsLangDropdownOpen(false)
                    // Reset risultati quando cambia lingua
                    setIsOpen(false)
                    setActiveIndex(-1)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    selectedLang === lang
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input Container */}
        <div className="relative flex-1 max-w-[800px] md:max-w-none" style={{ zIndex: 1000 }}>
          <div 
            className="relative" 
            style={{ 
              padding: '0',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                // Riapri i suggerimenti quando si inizia una nuova ricerca
                if (e.target.value.length >= 2) {
                  setIsOpen(true)
                } else {
                  setIsOpen(false)
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder="Cerca carte Magic: The Gathering..."
              className="w-full px-4 py-2 pr-16 text-sm md:text-[14px] border border-gray-200 
                       outline-none transition-all duration-200
                       focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:ring-opacity-30
                       placeholder-gray-400 bg-gray-50 focus:bg-white"
              style={{
                borderWidth: '0.5px',
                outline: 'none',
                boxShadow: 'none',
                borderRadius: isOpen && hasResults ? '10px 10px 0 0' : '10px',
                borderBottom: isOpen && hasResults ? 'none' : '0.5px solid #e5e7eb',
                marginBottom: isOpen && hasResults ? '0' : '0',
                backgroundColor: '#f9fafb',
                fontSize: '16px', // Previene lo zoom automatico su iOS Safari
                opacity: '1', // Assicura che sia sempre ben visibile
                fontWeight: '400',
              }}
              aria-label="Barra di ricerca carte Magic"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              role="combobox"
              autoComplete="off"
            />

            {/* Loading indicator */}
            {loading && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
              </div>
            )}

            {/* Clear button */}
            {searchQuery && !loading && (
              <button
                onClick={handleClear}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                aria-label="Cancella ricerca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Cache indicator */}
            {cached && searchQuery.length >= 2 && !loading && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400" title="Dati dalla cache">
                ⚡
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={() => handleSearch()}
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-orange-500 border-none rounded-md w-7 h-7 
                       flex justify-center items-center cursor-pointer
                       transition-all duration-200 hover:bg-orange-600
                       hover:shadow-[0_2px_8px_rgba(255,165,0,0.25)]
                       focus:outline-none focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 z-10"
              style={{ opacity: '1' }}
              aria-label="Cerca carte"
            >
              <Search className="text-white text-xs" style={{ width: '14px', height: '14px' }} />
            </button>
          </div>


          {/* Suggestions Dropdown */}
          {showDropdown && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full bg-white rounded-b-[10px] border-x border-b border-gray-200 shadow-lg max-h-96
                       md:max-h-96 max-h-[60vh] md:relative md:mt-0 fixed md:static top-[120px] left-4 right-4 md:left-auto md:right-auto"
              style={{
                marginTop: '-1px',
                borderTop: 'none', // Rimuove completamente il bordo superiore
                borderWidth: '0.5px',
                top: '100%',
                left: '0',
                right: '0',
                maxHeight: '400px', // Limita l'altezza massima per non estendersi troppo
                overflow: 'visible', // Permette all'immagine di uscire dai limiti
                position: 'relative', // Per permettere posizionamento assoluto dell'immagine
                opacity: '1', // Assicura che sia sempre ben visibile
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
              role="listbox"
            >
              {/* Preview immagine carta GRANDE - dentro il dropdown, sopra i risultati, come Cardmarket */}
              {(() => {
                if (hoveredCardIndex === null) {
                  return null
                }
                
                if (!displayResults[hoveredCardIndex]) {
                  return null
                }
                
                if (displayResults[hoveredCardIndex].type === 'set') {
                  return null
                }
                
                const printing = displayResults[hoveredCardIndex] as any
                const imageUrl = printing?.image_uri_normal || printing?.image_uri_small
                
                if (!imageUrl) {
                  return null
                }
                
                return (
                  <div 
                    className="absolute card-image-preview"
                    style={{
                      right: '0', // Posizionata a destra dentro il dropdown
                      top: '0',
                      zIndex: 10001,
                      pointerEvents: 'auto', // Permetti interazione per mantenere hover
                    }}
                    onMouseEnter={() => {
                      // Mantieni l'immagine visibile quando il mouse è sopra
                      if (hoveredCardIndex !== null) {
                        setHoveredCardIndex(hoveredCardIndex)
                      }
                    }}
                    onMouseLeave={() => {
                      // Reset con piccolo delay
                      setTimeout(() => {
                        setHoveredCardIndex(null)
                      }, 200)
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={printing?.name || 'Card image'}
                      className="rounded shadow-xl"
                      style={{ 
                        width: '300px', // Ridotta la grandezza
                        height: 'auto',
                        aspectRatio: '488/680',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })()}

              {/* Container scrollabile per i risultati */}
              <div className="overflow-y-auto max-h-96" style={{ maxHeight: '400px' }}>
              {error ? (
                <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-100">
                  {error}
                </div>
              ) : loading ? (
                <div className="px-4 py-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Ricerca in corso...</span>
                </div>
              ) : hasResults ? (
                <div className="divide-y divide-gray-100">
                  {displayResults.map((result, index) => {
                    const isActive = index === activeIndex
                    const isSet = result.type === 'set'
                    const set = isSet ? (result as Set & { type: 'set' }) : null
                    const printing = !isSet ? (result as any) : null
                    
                    // Chiave univoca
                    const uniqueKey = isSet 
                      ? `set-${set?.code}-${index}`
                      : printing?.printing_id 
                        ? `${printing.oracle_id}-${printing.printing_id}-${index}`
                        : `${printing?.oracle_id}-${index}`
                    
                    // Nome principale e traduzione
                    const primaryName = isSet ? set?.name : (printing?.preferredName || printing?.name)
                    const secondaryName = !isSet && printing?.preferredName && printing?.originalName && printing.originalName !== printing.preferredName
                      ? printing.originalName
                      : !isSet && printing?.name
                        ? printing.name
                        : null
                    
                    return (
                      <div
                        key={uniqueKey}
                        onClick={(e) => {
                          // Su mobile, se si clicca sull'icona fotocamera, non navigare
                          const target = e.target as HTMLElement
                          const isCameraClick = target.closest('.camera-icon-container')
                          if (isCameraClick && window.innerWidth < 768) {
                            return // Il click è gestito dall'icona fotocamera
                          }
                          handleResultClick(result)
                        }}
                        onMouseEnter={() => {
                          // Solo su desktop
                          if (window.innerWidth >= 768 && !isSet) {
                            setHoveredCardIndex(index)
                          }
                        }}
                        onMouseLeave={() => {
                          // Solo su desktop
                          if (window.innerWidth >= 768) {
                            // Reset solo se non è una carta o se non stiamo passando sopra l'immagine
                            if (!isSet) {
                              // Piccolo delay per permettere al mouse di raggiungere l'immagine
                              setTimeout(() => {
                                setHoveredCardIndex((prev) => prev === index ? null : prev)
                              }, 100)
                            }
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-orange-50 border-l-4 border-orange-500' 
                            : 'hover:bg-orange-50'
                        }`}
                        role="option"
                        aria-selected={isActive}
                      >
                        {/* Icona Fotocamera - mostra immagine al hover (desktop) o click (mobile) */}
                        <div className="flex-shrink-0 relative camera-icon-container">
                          {!isSet && (
                            <div 
                              className="relative"
                              onMouseEnter={() => {
                                // Solo su desktop
                                if (window.innerWidth >= 768) {
                                  setHoveredCardIndex(index)
                                }
                              }}
                              onMouseLeave={() => {
                                // Solo su desktop
                                if (window.innerWidth >= 768) {
                                  // Piccolo delay per permettere al mouse di raggiungere l'immagine
                                  setTimeout(() => {
                                    setHoveredCardIndex((prev) => {
                                      return prev === index ? null : prev
                                    })
                                  }, 200)
                                }
                              }}
                              onClick={(e) => {
                                // Su mobile, apri l'immagine in un overlay
                                if (window.innerWidth < 768) {
                                  e.stopPropagation()
                                  const printing = result as any
                                  const imageUrl = printing?.image_uri_normal || printing?.image_uri_small
                                  if (imageUrl) {
                                    setMobileImageOpen({
                                      url: imageUrl,
                                      name: printing?.preferredName || printing?.name || 'Card image'
                                    })
                                  }
                                }
                              }}
                            >
                              <Camera className="w-5 h-5 text-orange-600 cursor-pointer" />
                            </div>
                          )}
                        </div>

                        {/* Icona Set con tooltip */}
                        <div className="flex-shrink-0 relative">
                          {isSet ? (
                            <div 
                              className="relative"
                              onMouseEnter={() => setHoveredSetIconIndex(index)}
                              onMouseLeave={() => setHoveredSetIconIndex(null)}
                            >
                              {set?.icon_svg_uri ? (
                                <img
                                  src={set.icon_svg_uri}
                                  alt={set.name}
                                  className="w-6 h-6 object-contain"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
                                  <span className="text-xs font-bold text-gray-600">{set?.code?.toUpperCase().slice(0, 2)}</span>
                                </div>
                              )}
                              {/* Tooltip con nome completo del set */}
                              {hoveredSetIconIndex === index && (
                                <div 
                                  className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {set?.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div 
                              className="relative"
                              onMouseEnter={() => setHoveredSetIconIndex(index)}
                              onMouseLeave={() => setHoveredSetIconIndex(null)}
                            >
                              {/* Per le carte, mostra l'icona del set se disponibile */}
                              {printing?.set_name && (
                                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded cursor-pointer">
                                  {/* Usa set_code se disponibile, altrimenti crea abbreviazione da set_name */}
                                  <span className="text-xs font-bold text-gray-600">
                                    {(printing as any)?.set_code 
                                      ? (printing as any).set_code.toUpperCase().slice(0, 2)
                                      : printing.set_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                                    }
                                  </span>
                                </div>
                              )}
                              {/* Tooltip con nome completo del set */}
                              {hoveredSetIconIndex === index && printing?.set_name && (
                                <div 
                                  className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {printing.set_name}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Nome principale e traduzione */}
                        <div className="flex-1 min-w-0">
                          {/* Nome principale - grassetto e scuro */}
                          <div className="font-semibold text-gray-900 truncate">
                            {primaryName}
                          </div>
                          {/* Traduzione/secondary name - grigio chiaro e più piccolo */}
                          {secondaryName && (
                            <div className="text-sm text-gray-400 truncate mt-0.5">
                              {secondaryName}
                            </div>
                          )}
                        </div>

                        {/* Categoria a destra - Singles */}
                        {!isSet && (
                          <div className="flex-shrink-0 text-sm text-gray-400">
                            Singles
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Nessun risultato trovato per "{searchQuery}"
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Image Overlay */}
      {mobileImageOpen && (
        <div 
          className="fixed inset-0 z-[10000] bg-black bg-opacity-75 flex items-center justify-center md:hidden"
          onClick={handleCloseMobileImage}
        >
          <div 
            className="relative max-w-[90%] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCloseMobileImage()
              }}
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center
                       bg-white rounded-full shadow-lg
                       text-gray-700 hover:bg-gray-100
                       transition-all duration-200 z-10"
              aria-label="Chiudi immagine"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Card Image */}
            <img
              src={mobileImageOpen.url}
              alt={mobileImageOpen.name}
              className="rounded-lg shadow-2xl"
              style={{
                width: 'auto',
                maxWidth: '90%',
                maxHeight: '85vh',
                height: 'auto',
                aspectRatio: '488/680',
                objectFit: 'contain',
              }}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                handleCloseMobileImage()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}