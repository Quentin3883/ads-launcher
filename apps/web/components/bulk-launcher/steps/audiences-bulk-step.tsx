'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import {
  LANGUAGES,
  OPTIMIZATION_EVENTS,
  PLACEMENT_PRESETS,
  CAMPAIGN_TYPE_OPTIMIZATION_EVENTS,
  generateId,
  type AudiencePreset,
  type AudiencePresetType,
  type PlacementPreset,
} from '@launcher-ads/sdk'
import { Info, ChevronDown, X } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { FormSelect } from '@/components/ui/form-select'
import { SectionCard } from '@/components/ui/section-card'
import { InterestAutocomplete } from '../components/interest-autocomplete'
import { GeoLocationAutocomplete } from '../components/geo-location-autocomplete'

const AUDIENCE_PRESET_TYPES: { value: AudiencePresetType; label: string; description: string }[] = [
  { value: 'BROAD', label: 'Broad', description: 'Wide reach, no targeting' },
  { value: 'INTEREST', label: 'Interests', description: 'Target by interests' },
  { value: 'LOOKALIKE', label: 'Lookalike', description: 'Similar to your audience' },
  { value: 'CUSTOM_AUDIENCE', label: 'Custom', description: 'Your own audience list' },
]

const PLACEMENT_PRESET_OPTIONS: { value: PlacementPreset; label: string; placements: string[]; category?: string }[] = [
  { value: 'ALL_PLACEMENTS', label: 'All Placements', placements: PLACEMENT_PRESETS.ALL_PLACEMENTS },
  { value: 'FEEDS_REELS', label: 'Feeds + Reels', placements: PLACEMENT_PRESETS.FEEDS_REELS },
  { value: 'STORIES_ONLY', label: 'Stories Only', placements: PLACEMENT_PRESETS.STORIES_ONLY },
  { value: 'FACEBOOK_ONLY', label: 'Facebook Only', placements: PLACEMENT_PRESETS.FACEBOOK_ONLY, category: 'Platform' },
  { value: 'INSTAGRAM_ONLY', label: 'Instagram Only', placements: PLACEMENT_PRESETS.INSTAGRAM_ONLY, category: 'Platform' },
  { value: 'FEED_ONLY', label: 'Feed Only', placements: PLACEMENT_PRESETS.FEED_ONLY, category: 'Placement' },
  { value: 'REELS_ONLY', label: 'Reels Only', placements: PLACEMENT_PRESETS.REELS_ONLY, category: 'Placement' },
]

const LAL_PERCENTAGES = [1, 2, 3, 5, 10]

export function AudiencesBulkStep() {
  const { campaign, bulkAudiences, updateBulkAudiences, addAudience, removeAudience, togglePlacementPreset, getMatrixStats } = useBulkLauncher()
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkPasteText, setBulkPasteText] = useState('')
  const [newAudienceType, setNewAudienceType] = useState<AudiencePresetType>('BROAD')
  const [selectedInterests, setSelectedInterests] = useState<Array<{ id: string; name: string }>>([])
  const [selectedGeoLocations, setSelectedGeoLocations] = useState<Array<{ key: string; name: string; type: string }>>([])
  const [lalSource, setLalSource] = useState('')
  const [lalPercentages, setLalPercentages] = useState<number[]>([1])
  const [customAudienceId, setCustomAudienceId] = useState('')
  const [geoExpanded, setGeoExpanded] = useState(false)
  const [placementsExpanded, setPlacementsExpanded] = useState(false)

  // Get userId from URL params (TODO: replace with proper auth)
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('userId') || 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
    }
    return 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
  }, [])

  const isABO = campaign.budgetMode === 'ABO'
  const stats = getMatrixStats()

  // Filter optimization events based on campaign type
  const availableOptimizationEvents = useMemo(() => {
    const campaignType = campaign.type || 'Traffic'
    return CAMPAIGN_TYPE_OPTIMIZATION_EVENTS[campaignType] || OPTIMIZATION_EVENTS
  }, [campaign.type])

  // Auto-reset optimization event if current selection is not available for the new campaign type
  useEffect(() => {
    const currentEvent = bulkAudiences.optimizationEvent
    if (currentEvent && !availableOptimizationEvents.includes(currentEvent)) {
      // Set to first available option for this campaign type
      updateBulkAudiences({ optimizationEvent: availableOptimizationEvents[0] })
    }
  }, [campaign.type, availableOptimizationEvents, bulkAudiences.optimizationEvent, updateBulkAudiences])

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
          name: `Interests: ${selectedInterests.slice(0, 2).map(i => i.name).join(', ')}${selectedInterests.length > 2 ? '...' : ''}`,
          interests: selectedInterests.map(i => i.id),
        }
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
        setCustomAudienceId('')
        break
    }

    if (audience) {
      addAudience(audience)
    }
  }, [newAudienceType, selectedInterests, lalSource, lalPercentages, customAudienceId, addAudience])

  const handleBulkPasteInterests = useCallback(() => {
    const interests = bulkPasteText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (interests.length === 0) {
      alert('Please paste at least one interest (one per line)')
      return
    }

    interests.forEach((interest) => {
      addAudience({
        id: generateId(),
        type: 'INTEREST',
        name: `Interest: ${interest}`,
        interests: [interest],
      })
    })

    setBulkPasteText('')
    setShowBulkPaste(false)
  }, [bulkPasteText, addAudience])

  const handleGeoToggle = useCallback((type: 'countries' | 'regions' | 'cities', value: string) => {
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
  }, [bulkAudiences.geoLocations, updateBulkAudiences])

  const handleLanguageToggle = useCallback((language: string) => {
    const current = bulkAudiences.demographics.languages || []
    const newLanguages = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language]

    updateBulkAudiences({
      demographics: {
        ...bulkAudiences.demographics,
        languages: newLanguages,
      },
    })
  }, [bulkAudiences.demographics, updateBulkAudiences])

  return (
    <div className="space-y-6">
      {/* Header + Stats Preview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Bulk Audiences</h3>
          <p className="text-sm text-muted-foreground">Select multiple audiences, placements, and locations</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <div className="text-xs text-muted-foreground">Preview Ad Sets Count</div>
          <div className="text-2xl font-bold text-primary">{stats.adSets}</div>
        </div>
      </div>

      {/* Audience Builder - Compact */}
      <SectionCard title={`Audiences (${bulkAudiences.audiences.length})`}>
        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_PRESET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setNewAudienceType(type.value)
                // Auto-add Broad immediately
                if (type.value === 'BROAD') {
                  addAudience({
                    id: generateId(),
                    type: 'BROAD',
                    name: 'Broad',
                  })
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                newAudienceType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              + {type.label}
            </button>
          ))}
        </div>

        {/* Conditional inline forms */}
        {newAudienceType === 'INTEREST' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-medium text-foreground">Add Interest Audience</div>
            <InterestAutocomplete
              userId={userId}
              selectedInterests={selectedInterests}
              onAdd={(interest) => setSelectedInterests(prev => [...prev, interest])}
              onRemove={(id) => setSelectedInterests(prev => prev.filter(i => i.id !== id))}
              placeholder="Search interests..."
            />
            {selectedInterests.length > 0 && (
              <button
                onClick={handleAddAudience}
                className="w-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
              >
                Add ({selectedInterests.length} interests)
              </button>
            )}
          </div>
        )}

        {newAudienceType === 'LOOKALIKE' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-medium text-foreground">Add Lookalike Audience</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={lalSource}
                onChange={(e) => setLalSource(e.target.value)}
                placeholder="LAL Source"
                className="px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
              />
              <div className="flex flex-wrap gap-1">
                {LAL_PERCENTAGES.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      setLalPercentages((prev) =>
                        prev.includes(pct) ? prev.filter((p) => p !== pct) : [...prev, pct]
                      )
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      lalPercentages.includes(pct)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAddAudience}
              className="w-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
            >
              Add Lookalike
            </button>
          </div>
        )}

        {newAudienceType === 'CUSTOM_AUDIENCE' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-medium text-foreground">Add Custom Audience</div>
            <input
              type="text"
              value={customAudienceId}
              onChange={(e) => setCustomAudienceId(e.target.value)}
              placeholder="Custom Audience ID"
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
            />
            <button
              onClick={handleAddAudience}
              className="w-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
            >
              Add Custom Audience
            </button>
          </div>
        )}

        {/* Added Audiences - Compact Pills */}
        {bulkAudiences.audiences.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2">Added:</div>
            <div className="flex flex-wrap gap-2">
              {bulkAudiences.audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                >
                  <span>{audience.name}</span>
                  <button
                    onClick={() => removeAudience(audience.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Placement Presets - Compact */}
      <SectionCard title="Placement Presets">
        {/* Quick selection - Most used */}
        <div className="flex flex-wrap gap-2">
          {PLACEMENT_PRESET_OPTIONS.filter(p => !p.category).map((preset) => (
            <button
              key={preset.value}
              onClick={() => togglePlacementPreset(preset.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                bulkAudiences.placementPresets.includes(preset.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Expandable advanced options */}
        {bulkAudiences.placementPresets.length > 0 && (
          <button
            onClick={() => setPlacementsExpanded(!placementsExpanded)}
            className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${placementsExpanded ? 'rotate-180' : ''}`} />
            {placementsExpanded ? 'Hide' : 'Show'} advanced options
          </button>
        )}

        {placementsExpanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            {/* Platform Split */}
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By Platform</div>
              <div className="flex flex-wrap gap-2">
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Platform').map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => togglePlacementPreset(preset.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      bulkAudiences.placementPresets.includes(preset.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Placement Type Split */}
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By Placement Type</div>
              <div className="flex flex-wrap gap-2">
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Placement').map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => togglePlacementPreset(preset.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      bulkAudiences.placementPresets.includes(preset.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Geo Locations - Compact with Collapse */}
      <SectionCard title="Geo Locations *" icon={Info}>
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
          <button
            onClick={() => setGeoExpanded(!geoExpanded)}
            className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${geoExpanded ? 'rotate-180' : ''}`} />
            {geoExpanded ? 'Hide' : 'Show'} by type ({selectedGeoLocations.filter(l => l.type === 'country').length} countries, {selectedGeoLocations.filter(l => l.type === 'region').length} regions, {selectedGeoLocations.filter(l => l.type === 'city').length} cities)
          </button>
        )}

        {geoExpanded && (
          <div className="mt-3 space-y-3 pt-3 border-t border-border">
            {/* Countries */}
            {selectedGeoLocations.filter(l => l.type === 'country').length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Countries</label>
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
                <label className="block text-xs font-medium text-muted-foreground mb-2">Regions</label>
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
                <label className="block text-xs font-medium text-muted-foreground mb-2">Cities</label>
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
      </SectionCard>

      {/* Demographics */}
      <SectionCard title="Demographics">
        <div className="space-y-4">
          {/* Age Range and Gender - Same Line */}
          <div className="grid grid-cols-2 gap-6">
            {/* Age Range Slider - Dual Handle */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Age Range</label>
              <div className="relative h-10 flex items-center">
                {/* Age labels above handles */}
                <div
                  className="absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded shadow-sm"
                  style={{
                    left: `calc(${((bulkAudiences.demographics.ageMin - 13) / (65 - 13)) * 100}% - 12px)`,
                    transition: 'left 0.05s ease-out'
                  }}
                >
                  {bulkAudiences.demographics.ageMin}
                </div>
                <div
                  className="absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded shadow-sm"
                  style={{
                    left: `calc(${((bulkAudiences.demographics.ageMax - 13) / (65 - 13)) * 100}% - 12px)`,
                    transition: 'left 0.05s ease-out'
                  }}
                >
                  {bulkAudiences.demographics.ageMax === 65 ? '65+' : bulkAudiences.demographics.ageMax}
                </div>

                {/* Track */}
                <div className="absolute w-full h-1.5 bg-muted rounded-full"></div>

                {/* Active track between handles */}
                <div
                  className="absolute h-1.5 bg-primary rounded-full"
                  style={{
                    left: `${((bulkAudiences.demographics.ageMin - 13) / (65 - 13)) * 100}%`,
                    right: `${100 - ((bulkAudiences.demographics.ageMax - 13) / (65 - 13)) * 100}%`,
                    transition: 'left 0.05s ease-out, right 0.05s ease-out'
                  }}
                ></div>

                {/* Min handle */}
                <input
                  type="range"
                  min={13}
                  max={65}
                  value={bulkAudiences.demographics.ageMin}
                  onChange={(e) =>
                    updateBulkAudiences({
                      demographics: {
                        ...bulkAudiences.demographics,
                        ageMin: Math.min(Number(e.target.value), bulkAudiences.demographics.ageMax - 1)
                      },
                    })
                  }
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                />

                {/* Max handle */}
                <input
                  type="range"
                  min={13}
                  max={65}
                  value={bulkAudiences.demographics.ageMax}
                  onChange={(e) =>
                    updateBulkAudiences({
                      demographics: {
                        ...bulkAudiences.demographics,
                        ageMax: Math.max(Number(e.target.value), bulkAudiences.demographics.ageMin + 1)
                      },
                    })
                  }
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                />
              </div>
            </div>

            {/* Gender Selection (Pills) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Male', 'Female'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() =>
                      updateBulkAudiences({
                        demographics: { ...bulkAudiences.demographics, gender: gender as any },
                      })
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      bulkAudiences.demographics.gender === gender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Languages Dropdown */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Languages (optional)</label>
            <FormSelect
              value={(bulkAudiences.demographics.languages || [])[0] || ''}
              onChange={(val) =>
                updateBulkAudiences({
                  demographics: { ...bulkAudiences.demographics, languages: val ? [val] : [] },
                })
              }
              options={[
                { value: '', label: 'No language targeting' },
                ...LANGUAGES.map(lang => ({ value: lang, label: lang }))
              ]}
            />
          </div>
        </div>
      </SectionCard>

      {/* Optimization & Budget */}
      <SectionCard title="Optimization & Budget">
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Optimization Event *"
            value={bulkAudiences.optimizationEvent}
            onChange={(val) => updateBulkAudiences({ optimizationEvent: val })}
            options={availableOptimizationEvents.map((event) => ({
              value: event,
              label: event.replace(/_/g, ' '),
            }))}
          />

          {isABO && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget per Ad Set (USD) *</label>
              <div className="flex gap-2">
                <FormSelect
                  value={bulkAudiences.budgetType || 'daily'}
                  onChange={(val) => updateBulkAudiences({ budgetType: val as any })}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'lifetime', label: 'Lifetime' },
                  ]}
                  className="w-24"
                />
                <FormField
                  type="number"
                  min={5}
                  value={bulkAudiences.budgetPerAdSet || ''}
                  onChange={(val) => updateBulkAudiences({ budgetPerAdSet: Number(val) })}
                  placeholder="50"
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {!isABO && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Budget managed at campaign level (CBO)
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
