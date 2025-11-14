'use client'

import { useState, useMemo } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Info, ChevronDown } from 'lucide-react'
import { GeoLocationAutocomplete } from '../components/geo-location-autocomplete'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function GeolocationSection() {
  const { bulkAudiences, updateBulkAudiences } = useBulkLauncher()
  const [selectedGeoLocations, setSelectedGeoLocations] = useState<Array<{ key: string; name: string; type: string }>>([])
  const [geoExpanded, setGeoExpanded] = useState(false)

  // Get userId from URL params
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('userId') || 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
    }
    return 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Geo Locations *
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main autocomplete - searches all types */}
        <div>
          <GeoLocationAutocomplete
            value={selectedGeoLocations}
            onChange={(locs) => {
              setSelectedGeoLocations(locs)
              // Update bulk audiences
              updateBulkAudiences({
                geoLocations: {
                  countries: locs.filter(l => l.type === 'country').map(l => l.key),
                  regions: locs.filter(l => l.type === 'region').map(l => l.key),
                  cities: locs.filter(l => l.type === 'city').map(l => l.key),
                }
              })
            }}
            userId={userId}
            locationTypes={['country', 'region', 'city']}
            placeholder="Search countries, regions, or cities..."
          />
        </div>

        {/* Advanced options (collapsible) */}
        {selectedGeoLocations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGeoExpanded(!geoExpanded)}
            className="mt-3 h-auto py-0 text-xs"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform mr-2', geoExpanded && 'rotate-180')} />
            {geoExpanded ? 'Hide' : 'Show'} by type ({selectedGeoLocations.filter(l => l.type === 'country').length} countries, {selectedGeoLocations.filter(l => l.type === 'region').length} regions, {selectedGeoLocations.filter(l => l.type === 'city').length} cities)
          </Button>
        )}

        {geoExpanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-4">
            {/* Countries */}
            {selectedGeoLocations.filter(l => l.type === 'country').length > 0 && (
              <div>
                <Label className="mb-2">Countries</Label>
                <GeoLocationAutocomplete
                  value={selectedGeoLocations.filter(loc => loc.type === 'country')}
                  onChange={(locs) => {
                    const otherLocs = selectedGeoLocations.filter(loc => loc.type !== 'country')
                    const newLocs = [...locs, ...otherLocs]
                    setSelectedGeoLocations(newLocs)
                    updateBulkAudiences({
                      geoLocations: {
                        ...bulkAudiences.geoLocations,
                        countries: locs.map(l => l.key),
                      }
                    })
                  }}
                  userId={userId}
                  locationTypes={['country']}
                  placeholder="Search countries..."
                />
              </div>
            )}

            {/* Regions */}
            {selectedGeoLocations.filter(l => l.type === 'region').length > 0 && (
              <div>
                <Label className="mb-2">Regions</Label>
                <GeoLocationAutocomplete
                  value={selectedGeoLocations.filter(loc => loc.type === 'region')}
                  onChange={(locs) => {
                    const otherLocs = selectedGeoLocations.filter(loc => loc.type !== 'region')
                    const newLocs = [...locs, ...otherLocs]
                    setSelectedGeoLocations(newLocs)
                    updateBulkAudiences({
                      geoLocations: {
                        ...bulkAudiences.geoLocations,
                        regions: locs.map(l => l.key),
                      }
                    })
                  }}
                  userId={userId}
                  locationTypes={['region']}
                  placeholder="Search regions..."
                />
              </div>
            )}

            {/* Cities */}
            {selectedGeoLocations.filter(l => l.type === 'city').length > 0 && (
              <div>
                <Label className="mb-2">Cities</Label>
                <GeoLocationAutocomplete
                  value={selectedGeoLocations.filter(loc => loc.type === 'city')}
                  onChange={(locs) => {
                    const otherLocs = selectedGeoLocations.filter(loc => loc.type !== 'city')
                    const newLocs = [...locs, ...otherLocs]
                    setSelectedGeoLocations(newLocs)
                    updateBulkAudiences({
                      geoLocations: {
                        ...bulkAudiences.geoLocations,
                        cities: locs.map(l => l.key),
                      }
                    })
                  }}
                  userId={userId}
                  locationTypes={['city']}
                  placeholder="Search cities..."
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
