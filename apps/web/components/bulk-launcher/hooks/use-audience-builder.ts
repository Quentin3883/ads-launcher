import { useState, useCallback } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { generateId, type AudiencePresetType, type AudiencePreset } from '@launcher-ads/sdk'

interface Interest {
  id: string
  name: string
}

/**
 * Hook for managing audience creation state and handlers
 * Handles Interest, Lookalike, and Custom Audience creation
 */
export function useAudienceBuilder() {
  const { addAudience } = useBulkLauncher()

  // Audience type selection
  const [newAudienceType, setNewAudienceType] = useState<AudiencePresetType>('BROAD')

  // Interest audience state
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([])

  // Lookalike audience state
  const [lalSource, setLalSource] = useState('')
  const [lalPercentages, setLalPercentages] = useState<number[]>([1])

  // Custom audience state
  const [customAudienceId, setCustomAudienceId] = useState('')

  /**
   * Add an interest to the selection
   */
  const handleAddInterest = useCallback((interest: Interest) => {
    setSelectedInterests((prev) => [...prev, interest])
  }, [])

  /**
   * Remove an interest from the selection
   */
  const handleRemoveInterest = useCallback((id: string) => {
    setSelectedInterests((prev) => prev.filter((i) => i.id !== id))
  }, [])

  /**
   * Toggle a LAL percentage (1%, 2%, 3%, 5%, 10%)
   */
  const handleToggleLalPercentage = useCallback((pct: number) => {
    setLalPercentages((prev) =>
      prev.includes(pct) ? prev.filter((p) => p !== pct) : [...prev, pct]
    )
  }, [])

  /**
   * Create and add the audience based on current type
   */
  const handleAddAudience = useCallback(() => {
    let audience: AudiencePreset | null = null

    switch (newAudienceType) {
      case 'BROAD':
        audience = {
          id: generateId(),
          type: 'BROAD',
          name: 'Broad',
        }
        break

      case 'INTEREST':
        if (selectedInterests.length === 0) {
          alert('Please select at least one interest')
          return
        }
        audience = {
          id: generateId(),
          type: 'INTEREST',
          name: `Interests: ${selectedInterests.slice(0, 2).map((i) => i.name).join(', ')}${selectedInterests.length > 2 ? '...' : ''}`,
          interests: selectedInterests.map((i) => i.id),
        }
        // Reset interest selection
        setSelectedInterests([])
        break

      case 'LOOKALIKE':
        if (!lalSource) {
          alert('Please enter LAL source')
          return
        }
        audience = {
          id: generateId(),
          type: 'LOOKALIKE',
          name: `LAL ${lalPercentages.join(', ')}% - ${lalSource}`,
          lookalikeSource: lalSource,
          lookalikePercentages: lalPercentages,
        }
        // Reset LAL form
        setLalSource('')
        setLalPercentages([1])
        break

      case 'CUSTOM_AUDIENCE':
        if (!customAudienceId) {
          alert('Please enter custom audience ID')
          return
        }
        audience = {
          id: generateId(),
          type: 'CUSTOM_AUDIENCE',
          name: `Custom: ${customAudienceId}`,
          customAudienceId,
        }
        // Reset custom audience form
        setCustomAudienceId('')
        break
    }

    if (audience) {
      addAudience(audience)
    }
  }, [newAudienceType, selectedInterests, lalSource, lalPercentages, customAudienceId, addAudience])

  /**
   * Quick add Broad audience (bypasses form)
   */
  const handleQuickAddBroad = useCallback(() => {
    addAudience({
      id: generateId(),
      type: 'BROAD',
      name: 'Broad',
    })
  }, [addAudience])

  return {
    // State
    newAudienceType,
    selectedInterests,
    lalSource,
    lalPercentages,
    customAudienceId,

    // Setters
    setNewAudienceType,
    setLalSource,
    setCustomAudienceId,

    // Handlers
    handleAddInterest,
    handleRemoveInterest,
    handleToggleLalPercentage,
    handleAddAudience,
    handleQuickAddBroad,
  }
}
