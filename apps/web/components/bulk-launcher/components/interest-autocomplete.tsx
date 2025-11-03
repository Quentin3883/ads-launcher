'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@launcher-ads/ui'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface Interest {
  id: string
  name: string
  audience_size_lower_bound?: number
  audience_size_upper_bound?: number
  path?: string[]
  description?: string
}

interface InterestAutocompleteProps {
  value: Interest[]
  onChange: (interests: Interest[]) => void
  placeholder?: string
  maxSelections?: number
  userId: string
  showSuggestions?: boolean
}

export function InterestAutocomplete({
  value,
  onChange,
  placeholder = 'Search interests...',
  maxSelections,
  userId,
  showSuggestions = true,
}: InterestAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search interests via tRPC
  const { data: searchResults, isLoading } = trpc.facebookCampaigns.searchInterests.useQuery(
    {
      userId,
      q: debouncedSearch,
      limit: 25,
    },
    {
      enabled: debouncedSearch.length >= 2,
    }
  )

  // Get interest suggestions based on selected interests
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    trpc.facebookCampaigns.getInterestSuggestions.useQuery(
      {
        userId,
        interests: value.map((i) => i.id),
      },
      {
        enabled: showSuggestions && value.length > 0 && value.length < 3,
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
    (interest: any) => {
      const newInterest: Interest = {
        id: interest.id,
        name: interest.name,
        audience_size_lower_bound: interest.audience_size_lower_bound,
        audience_size_upper_bound: interest.audience_size_upper_bound,
        path: interest.path,
        description: interest.description,
      }

      // Check if already selected
      if (value.some((int) => int.id === newInterest.id)) {
        return
      }

      // Check max selections
      if (maxSelections && value.length >= maxSelections) {
        return
      }

      onChange([...value, newInterest])
      setSearchQuery('')
      setIsOpen(false)
    },
    [value, onChange, maxSelections]
  )

  const handleRemove = useCallback(
    (id: string) => {
      onChange(value.filter((int) => int.id !== id))
    },
    [value, onChange]
  )

  const formatAudienceSize = (lower?: number, upper?: number) => {
    if (!lower || !upper) return null

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
      return num.toString()
    }

    return `${formatNumber(lower)} - ${formatNumber(upper)}`
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-4">
      {/* Selected interests */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((interest) => (
            <div
              key={interest.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm"
            >
              <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-medium">{interest.name}</span>
              {interest.audience_size_lower_bound && interest.audience_size_upper_bound && (
                <span className="text-xs text-muted-foreground">
                  ({formatAudienceSize(interest.audience_size_lower_bound, interest.audience_size_upper_bound)})
                </span>
              )}
              <button
                onClick={() => handleRemove(interest.id)}
                className="ml-1 hover:bg-purple-500/20 rounded p-0.5 transition-colors"
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
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  disabled={value.some((int) => int.id === result.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                    value.some((int) => int.id === result.id)
                      ? 'bg-muted/50 cursor-not-allowed opacity-50'
                      : 'hover:bg-muted cursor-pointer'
                  )}
                >
                  <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{result.name}</div>
                    {result.path && result.path.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {result.path.join(' > ')}
                      </div>
                    )}
                    {result.audience_size_lower_bound && result.audience_size_upper_bound && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Audience: {formatAudienceSize(result.audience_size_lower_bound, result.audience_size_upper_bound)}
                      </div>
                    )}
                  </div>
                  {value.some((int) => int.id === result.id) && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">Selected</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No interests found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Interest suggestions */}
      {showSuggestions && suggestions && suggestions.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Suggested interests based on your selection:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((suggestion: any) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelect(suggestion)}
                disabled={value.some((int) => int.id === suggestion.id) || (maxSelections ? value.length >= maxSelections : false)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  value.some((int) => int.id === suggestion.id)
                    ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                    : 'bg-white border-purple-200 text-foreground hover:bg-purple-50 hover:border-purple-300'
                )}
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
