'use client'

import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { SectionCard } from '@/components/ui/section-card'
import { Info } from 'lucide-react'
import { COUNTRIES, REGIONS, CITIES } from '@/lib/types/bulk-launcher'

interface GeoLocationPickerProps {
  selectedCountries: string[]
  selectedRegions: string[]
  selectedCities: string[]
  onToggleCountry: (country: string) => void
  onToggleRegion: (region: string) => void
  onToggleCity: (city: string) => void
}

export function GeoLocationPicker({
  selectedCountries,
  selectedRegions,
  selectedCities,
  onToggleCountry,
  onToggleRegion,
  onToggleCity,
}: GeoLocationPickerProps) {
  const selectedCountry = selectedCountries[0]
  const availableRegions = selectedCountry ? REGIONS[selectedCountry] || [] : []
  const availableCities = selectedCountry ? CITIES[selectedCountry] || [] : []

  return (
    <SectionCard title="Geo Locations *" icon={Info}>
      <ToggleButtonGroup
        label="Countries"
        items={COUNTRIES}
        selectedItems={selectedCountries}
        onToggle={onToggleCountry}
        size="sm"
      />

      {availableRegions.length > 0 && (
        <ToggleButtonGroup
          label="Regions (optional)"
          items={availableRegions}
          selectedItems={selectedRegions}
          onToggle={onToggleRegion}
          size="sm"
        />
      )}

      {availableCities.length > 0 && (
        <ToggleButtonGroup
          label="Cities (optional)"
          items={availableCities}
          selectedItems={selectedCities}
          onToggle={onToggleCity}
          size="sm"
        />
      )}
    </SectionCard>
  )
}
