'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin } from 'lucide-react'

interface GeoLocation {
  key: string
  name: string
  type: string
  country_code?: string
  country_name?: string
  region?: string
  region_id?: number
}

interface GeoAutocompleteProps {
  adAccountId: string
  selectedLocations: GeoLocation[]
  onAdd: (location: GeoLocation) => void
  onRemove: (key: string) => void
  placeholder?: string
  types?: Array<'country' | 'region' | 'city' | 'zip'>
}

export function GeoAutocomplete({
  adAccountId,
  selectedLocations,
  onAdd,
  onRemove,
  placeholder = 'Search cities, regions, countries...',
  types = ['country', 'region', 'city'],
}: GeoAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const typesParam = types.join(',')
        const response = await fetch(
          `http://localhost:4000/facebook/targeting/geo/search?adAccountId=${adAccountId}&q=${encodeURIComponent(query)}&types=${typesParam}`
        )
        const data = await response.json()

        if (data.success) {
          setResults(data.data || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error('Error searching geo locations:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, adAccountId, types])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (location: GeoLocation) => {
    // Check if already selected
    if (!selectedLocations.find(l => l.key === location.key)) {
      onAdd(location)
    }
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const getLocationIcon = (type: string) => {
    return '📍'
  }

  const getLocationSubtext = (location: GeoLocation) => {
    const parts: string[] = []
    if (location.region && location.type === 'city') {
      parts.push(location.region)
    }
    if (location.country_name && location.type !== 'country') {
      parts.push(location.country_name)
    }
    if (location.type) {
      parts.push(location.type.charAt(0).toUpperCase() + location.type.slice(1))
    }
    return parts.join(' • ')
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && results.length > 0 && setShowResults(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {results.map((location) => {
              const isSelected = selectedLocations.some(l => l.key === location.key)
              return (
                <button
                  key={location.key}
                  onClick={() => !isSelected && handleSelect(location)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-start gap-2 ${
                    isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-base mt-0.5">{getLocationIcon(location.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {location.name}
                      {isSelected && <span className="ml-2 text-xs text-muted-foreground">(selected)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getLocationSubtext(location)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* No results */}
        {showResults && results.length === 0 && !loading && query.length >= 2 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground"
          >
            No locations found for "{query}"
          </div>
        )}
      </div>

      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLocations.map((location) => (
            <div
              key={location.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
            >
              <MapPin className="h-3 w-3" />
              <span>{location.name}</span>
              {location.country_code && location.type !== 'country' && (
                <span className="text-[10px] opacity-70">({location.country_code})</span>
              )}
              <button
                onClick={() => onRemove(location.key)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
