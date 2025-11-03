import { useCallback } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { generateId } from '@launcher-ads/sdk'
import type { AudiencePreset, AudiencePresetType } from '@launcher-ads/sdk'

/**
 * Custom hook for audience form logic
 * Separates UI from business logic
 */
export function useAudienceForm() {
  const { bulkAudiences, updateBulkAudiences, addAudience, removeAudience, togglePlacementPreset } =
    useBulkLauncher()

  const handleAddAudience = useCallback(
    (type: AudiencePresetType, data: any) => {
      let audience: AudiencePreset | null = null

      switch (type) {
        case 'BROAD':
          audience = {
            id: generateId(),
            type: 'BROAD',
            name: 'Broad',
          }
          break

        case 'INTEREST':
          if (!data.interests || data.interests.length === 0) {
            throw new Error('At least one interest is required')
          }
          audience = {
            id: generateId(),
            type: 'INTEREST',
            name: `Interests: ${data.interests.slice(0, 2).join(', ')}${data.interests.length > 2 ? '...' : ''}`,
            interests: data.interests,
          }
          break

        case 'LOOKALIKE':
          if (!data.source) {
            throw new Error('LAL source is required')
          }
          audience = {
            id: generateId(),
            type: 'LOOKALIKE',
            name: `LAL ${data.percentages.join(', ')}% - ${data.source}`,
            lookalikeSource: data.source,
            lookalikePercentages: data.percentages,
          }
          break

        case 'CUSTOM_AUDIENCE':
          if (!data.audienceId) {
            throw new Error('Custom audience ID is required')
          }
          audience = {
            id: generateId(),
            type: 'CUSTOM_AUDIENCE',
            name: `Custom: ${data.audienceId}`,
            customAudienceId: data.audienceId,
          }
          break
      }

      if (audience) {
        addAudience(audience)
      }
    },
    [addAudience]
  )

  const handleBulkPasteInterests = useCallback(
    (text: string) => {
      const interests = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (interests.length === 0) {
        throw new Error('Please paste at least one interest (one per line)')
      }

      interests.forEach((interest) => {
        addAudience({
          id: generateId(),
          type: 'INTEREST',
          name: `Interest: ${interest}`,
          interests: [interest],
        })
      })

      return interests.length
    },
    [addAudience]
  )

  const handleGeoToggle = useCallback(
    (type: 'countries' | 'regions' | 'cities', value: string) => {
      const currentArray = bulkAudiences.geoLocations[type] || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value]

      updateBulkAudiences({
        geoLocations: {
          ...bulkAudiences.geoLocations,
          [type]: newArray,
        },
      })
    },
    [bulkAudiences.geoLocations, updateBulkAudiences]
  )

  const handleDemographicsUpdate = useCallback(
    (updates: Partial<typeof bulkAudiences.demographics>) => {
      updateBulkAudiences({
        demographics: {
          ...bulkAudiences.demographics,
          ...updates,
        },
      })
    },
    [bulkAudiences.demographics, updateBulkAudiences]
  )

  return {
    audiences: bulkAudiences.audiences,
    geoLocations: bulkAudiences.geoLocations,
    demographics: bulkAudiences.demographics,
    placementPresets: bulkAudiences.placementPresets,
    optimizationEvent: bulkAudiences.optimizationEvent,
    budgetType: bulkAudiences.budgetType,
    budgetPerAdSet: bulkAudiences.budgetPerAdSet,
    handleAddAudience,
    handleBulkPasteInterests,
    handleGeoToggle,
    handleDemographicsUpdate,
    removeAudience,
    togglePlacementPreset,
    updateBulkAudiences,
  }
}
