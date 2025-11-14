'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { facebookTargetingAPI } from '@/lib/api'

interface Interest {
  id: string
  name: string
  audience_size_lower_bound?: number
  audience_size_upper_bound?: number
  topic?: string
  path?: string[]
}

interface InterestAutocompleteProps {
  userId: string
  selectedInterests: Interest[]
  onAdd: (interest: Interest) => void
  onRemove: (id: string) => void
  placeholder?: string
}

export function InterestAutocomplete({
  userId,
  selectedInterests,
  onAdd,
  onRemove,
  placeholder = 'Search interests (e.g., fitness, technology, cooking...)',
}: InterestAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Interest[]>([])
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
        const data = await facebookTargetingAPI.searchInterests(userId, query, 25)
        setResults(data)
        setShowResults(true)
      } catch (error) {
        console.error('Error searching interests:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, userId])

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

  const handleSelect = (interest: Interest) => {
    // Check if already selected
    if (!selectedInterests.find(i => i.id === interest.id)) {
      onAdd(interest)
    }
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const formatAudienceSize = (lower?: number, upper?: number) => {
    if (!lower && !upper) return null

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
      return num.toString()
    }

    if (lower && upper) {
      return `${formatNumber(lower)} - ${formatNumber(upper)} people`
    }
    return null
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && results.length > 0 && setShowResults(true)}
            placeholder={placeholder}
            className="pl-10 pr-10"
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
            {results.map((interest) => {
              const isSelected = selectedInterests.some(i => i.id === interest.id)
              const audienceSize = formatAudienceSize(interest.audience_size_lower_bound, interest.audience_size_upper_bound)

              return (
                <Button
                  key={interest.id}
                  onClick={() => !isSelected && handleSelect(interest)}
                  disabled={isSelected}
                  variant="ghost"
                  className="w-full justify-start text-left px-3 py-2 h-auto flex items-start gap-2"
                >
                  <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {interest.name}
                      {isSelected && <span className="ml-2 text-xs text-muted-foreground">(selected)</span>}
                    </div>
                    {audienceSize && (
                      <div className="text-xs text-muted-foreground truncate">
                        {audienceSize}
                      </div>
                    )}
                  </div>
                </Button>
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
            No interests found for "{query}"
          </div>
        )}
      </div>

      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInterests.map((interest) => (
            <div
              key={interest.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-medium"
            >
              <Target className="h-3 w-3" />
              <span>{interest.name}</span>
              <Button
                onClick={() => onRemove(interest.id)}
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-green-500/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
