'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, Map, Globe } from 'lucide-react'

interface GeoLocation {
  key: string
  name: string
  type: 'country' | 'region' | 'city'
  countryCode?: string
  regionName?: string
}

interface UnifiedGeoAutocompleteProps {
  value: GeoLocation[]
  onChange: (locations: GeoLocation[]) => void
  placeholder?: string
  userId: string
}

export function UnifiedGeoAutocomplete({
  value,
  onChange,
  placeholder = 'Search countries, regions, or cities...',
  userId,
}: UnifiedGeoAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `http://localhost:4000/facebook/geo-locations/search?query=${encodeURIComponent(query)}&userId=${userId}`
        )

        if (!response.ok) throw new Error('Failed to fetch geo locations')

        const data = await response.json()

        // Convert API response to unified format
        const unified: GeoLocation[] = []

        // Add countries
        if (data.countries) {
          data.countries.forEach((item: any) => {
            unified.push({
              key: item.key,
              name: item.name,
              type: 'country',
              countryCode: item.country_code,
            })
          })
        }

        // Add regions
        if (data.regions) {
          data.regions.forEach((item: any) => {
            unified.push({
              key: item.key,
              name: item.name,
              type: 'region',
              countryCode: item.country_code,
              regionName: item.region,
            })
          })
        }

        // Add cities
        if (data.cities) {
          data.cities.forEach((item: any) => {
            unified.push({
              key: item.key,
              name: item.name,
              type: 'city',
              countryCode: item.country_code,
              regionName: item.region,
            })
          })
        }

        setSuggestions(unified)
      } catch (error) {
        console.error('Error fetching geo locations:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query, userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (location: GeoLocation) => {
    // Check if already selected
    if (value.some(v => v.key === location.key)) {
      return
    }

    onChange([...value, location])
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleRemove = (key: string) => {
    onChange(value.filter(v => v.key !== key))
  }

  const getIcon = (type: GeoLocation['type']) => {
    switch (type) {
      case 'country':
        return <Globe className="h-4 w-4" />
      case 'region':
        return <Map className="h-4 w-4" />
      case 'city':
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: GeoLocation['type']) => {
    switch (type) {
      case 'country':
        return 'bg-blue-100 text-blue-700'
      case 'region':
        return 'bg-purple-100 text-purple-700'
      case 'city':
        return 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected Locations */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((location) => (
            <div
              key={location.key}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getTypeColor(location.type)}`}
            >
              {getIcon(location.type)}
              <span>{location.name}</span>
              <button
                onClick={() => handleRemove(location.key)}
                className="hover:opacity-70 transition-opacity"
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (query.length >= 2 || suggestions.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                {query.length < 2 ? 'Type at least 2 characters' : 'No locations found'}
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((location) => {
                  const isSelected = value.some(v => v.key === location.key)
                  return (
                    <button
                      key={location.key}
                      onClick={() => handleSelect(location)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'opacity-50 cursor-not-allowed bg-muted'
                          : 'hover:bg-muted cursor-pointer'
                      }`}
                      type="button"
                    >
                      <div className={`p-1.5 rounded ${getTypeColor(location.type)}`}>
                        {getIcon(location.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {location.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {location.type === 'city' && location.regionName
                            ? `${location.regionName}, ${location.countryCode}`
                            : location.type === 'region'
                            ? location.countryCode
                            : location.countryCode}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {location.type}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Type "Paris" for cities, "Île-de-France" for regions, or "France" for countries
      </p>
    </div>
  )
}
