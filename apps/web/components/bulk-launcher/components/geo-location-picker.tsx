'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Info } from 'lucide-react'
import { COUNTRIES, REGIONS, CITIES } from '@launcher-ads/sdk'

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Geo Locations *
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Countries</Label>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <Badge
                key={country}
                variant={selectedCountries.includes(country) ? 'default' : 'outline'}
                className="cursor-pointer text-xs px-3 py-1.5"
                onClick={() => onToggleCountry(country)}
              >
                {country}
              </Badge>
            ))}
          </div>
        </div>

        {availableRegions.length > 0 && (
          <div className="space-y-2">
            <Label>Regions (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableRegions.map((region) => (
                <Badge
                  key={region}
                  variant={selectedRegions.includes(region) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs px-3 py-1.5"
                  onClick={() => onToggleRegion(region)}
                >
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {availableCities.length > 0 && (
          <div className="space-y-2">
            <Label>Cities (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableCities.map((city) => (
                <Badge
                  key={city}
                  variant={selectedCities.includes(city) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs px-3 py-1.5"
                  onClick={() => onToggleCity(city)}
                >
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
