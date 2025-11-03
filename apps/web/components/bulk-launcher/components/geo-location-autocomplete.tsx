'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, MapPin, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@launcher-ads/ui'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface GeoLocation {
  key: string
  name: string
  type: string
  country_code?: string
  country_name?: string
  region?: string
  region_id?: number
}

interface GeoLocationAutocompleteProps {
  value: GeoLocation[]
  onChange: (locations: GeoLocation[]) => void
  locationTypes?: Array<'country' | 'region' | 'city' | 'zip'>
  placeholder?: string
  maxSelections?: number
  userId: string
}

export function GeoLocationAutocomplete({
  value,
  onChange,
  locationTypes = ['country', 'region', 'city'],
  placeholder = 'Search locations...',
  maxSelections,
  userId,
}: GeoLocationAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search geo locations via tRPC
  const { data: searchResults, isLoading } = trpc.facebookCampaigns.searchGeoLocations.useQuery(
    {
      userId,
      q: debouncedSearch,
      location_types: locationTypes,
      limit: 25,
    },
    {
      enabled: debouncedSearch.length >= 2,
    }
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (location: any) => {
      const newLocation: GeoLocation = {
        key: location.key,
        name: location.name,
        type: location.type,
        country_code: location.country_code,
        country_name: location.country_name,
        region: location.region,
        region_id: location.region_id,
      }

      // Check if already selected
      if (value.some((loc) => loc.key === newLocation.key)) {
        return
      }

      // Check max selections
      if (maxSelections && value.length >= maxSelections) {
        return
      }

      onChange([...value, newLocation])
      setSearchQuery('')
      setIsOpen(false)
    },
    [value, onChange, maxSelections]
  )

  const handleRemove = useCallback(
    (key: string) => {
      onChange(value.filter((loc) => loc.key !== key))
    },
    [value, onChange]
  )

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'country':
        return '🌍'
      case 'region':
        return '📍'
      case 'city':
        return '🏙️'
      case 'zip':
        return '📮'
      default:
        return '📍'
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected locations */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((location) => (
            <div
              key={location.key}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm"
            >
              <span>{getLocationTypeIcon(location.type)}</span>
              <span className="font-medium">{location.name}</span>
              {location.country_name && location.type !== 'country' && (
                <span className="text-muted-foreground">({location.country_name})</span>
              )}
              <button
                onClick={() => handleRemove(location.key)}
                className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          disabled={maxSelections ? value.length >= maxSelections : false}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((result: any) => (
                <button
                  key={result.key}
                  onClick={() => handleSelect(result)}
                  disabled={value.some((loc) => loc.key === result.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    value.some((loc) => loc.key === result.key)
                      ? 'bg-muted/50 cursor-not-allowed opacity-50'
                      : 'hover:bg-muted cursor-pointer'
                  )}
                >
                  <span className="text-lg">{getLocationTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{result.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      {result.country_name && result.type !== 'country' && ` • ${result.country_name}`}
                      {result.region && result.type === 'city' && ` • ${result.region}`}
                    </div>
                  </div>
                  {value.some((loc) => loc.key === result.key) && (
                    <span className="text-xs text-muted-foreground">Selected</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No locations found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
