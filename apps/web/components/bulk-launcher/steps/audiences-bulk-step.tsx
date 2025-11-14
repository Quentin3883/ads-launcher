// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
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
import { InterestAutocomplete } from '../components/interest-autocomplete'
import { GeoLocationAutocomplete } from '../components/geo-location-autocomplete'
import { trpc } from '@/lib/trpc'
import { FormSection, FormRow, Select, Input, ds, Button } from '../ui/shadcn'

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
  const { campaign, bulkAudiences, updateBulkAudiences, addAudience, removeAudience, togglePlacementPreset, getMatrixStats, adAccountId, facebookPixelId } = useBulkLauncher()
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

  // Auto-set optimization event based on campaign type
  useEffect(() => {
    const currentEvent = bulkAudiences.optimizationEvent

    // If no event is selected or current event is not available, set to first available option
    if (!currentEvent || !availableOptimizationEvents.includes(currentEvent)) {
      updateBulkAudiences({ optimizationEvent: availableOptimizationEvents[0] })
    }
  }, [campaign.type, availableOptimizationEvents, bulkAudiences.optimizationEvent, updateBulkAudiences])

  // Fetch pixel events and custom conversions when pixel is configured
  const { data: pixelEvents } = trpc.facebookCampaigns.getPixelEvents.useQuery(
    { adAccountId: adAccountId!, pixelId: facebookPixelId! },
    { enabled: !!adAccountId && !!facebookPixelId }
  )

  const { data: customConversions } = trpc.facebookCampaigns.getCustomConversions.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId && !!facebookPixelId }
  )

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
    <div className={ds.spacing.vertical.lg}>
      {/* Header + Stats Preview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={ds.typography.pageTitle}>Bulk Audiences</h3>
          <p className={ds.componentPresets.hint}>Select multiple audiences, placements, and locations</p>
        </div>
        <div className={ds.cn('rounded-lg border border-primary/30 bg-primary/5', ds.spacing.padding.md)}>
          <div className={ds.cn(ds.typography.caption, 'text-muted-foreground')}>Preview Ad Sets Count</div>
          <div className={ds.cn('text-2xl font-bold text-primary')}>{stats.adSets}</div>
        </div>
      </div>

      {/* Audience Builder */}
      <FormSection title={`Audiences (${bulkAudiences.audiences.length})`}>
        {/* Quick Add Buttons */}
        <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
          {AUDIENCE_PRESET_TYPES.map((type) => (
            <Button
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
              variant={newAudienceType === type.value ? 'default' : 'secondary'}
              className={ds.cn(
                'px-3 py-1.5 rounded-full font-medium transition-all',
                ds.typography.caption
              )}
            >
              + {type.label}
            </Button>
          ))}
        </div>

        {/* Conditional inline forms */}
        {newAudienceType === 'INTEREST' && (
          <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
            <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>Add Interest Audience</div>
            <InterestAutocomplete
              userId={userId}
              selectedInterests={selectedInterests}
              onAdd={(interest) => setSelectedInterests(prev => [...prev, interest])}
              onRemove={(id) => setSelectedInterests(prev => prev.filter(i => i.id !== id))}
              placeholder="Search interests..."
            />
            {selectedInterests.length > 0 && (
              <Button
                onClick={handleAddAudience}
                className={ds.cn(
                  'w-full px-3 py-1.5 rounded-lg',
                  ds.typography.caption
                )}
              >
                Add ({selectedInterests.length} interests)
              </Button>
            )}
          </div>
        )}

        {newAudienceType === 'LOOKALIKE' && (
          <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
            <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>Add Lookalike Audience</div>
            <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
              <Input
                value={lalSource}
                onChange={(value) => setLalSource(value)}
                placeholder="LAL Source"
                className={ds.typography.caption}
              />
              <div className={ds.cn('flex flex-wrap', ds.spacing.gap.xs)}>
                {LAL_PERCENTAGES.map((pct) => (
                  <Button
                    key={pct}
                    onClick={() => {
                      setLalPercentages((prev) =>
                        prev.includes(pct) ? prev.filter((p) => p !== pct) : [...prev, pct]
                      )
                    }}
                    variant={lalPercentages.includes(pct) ? 'default' : 'secondary'}
                    className={ds.cn(
                      'px-2 py-1 rounded',
                      ds.typography.caption
                    )}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleAddAudience}
              className={ds.cn(
                'w-full px-3 py-1.5 rounded-lg',
                ds.typography.caption
              )}
            >
              Add Lookalike
            </Button>
          </div>
        )}

        {newAudienceType === 'CUSTOM_AUDIENCE' && (
          <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
            <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>Add Custom Audience</div>
            <Input
              value={customAudienceId}
              onChange={(value) => setCustomAudienceId(value)}
              placeholder="Custom Audience ID"
              className={ds.cn('w-full', ds.typography.caption)}
            />
            <Button
              onClick={handleAddAudience}
              className={ds.cn(
                'w-full px-3 py-1.5 rounded-lg',
                ds.typography.caption
              )}
            >
              Add Custom Audience
            </Button>
          </div>
        )}

        {/* Added Audiences - Compact Pills */}
        {bulkAudiences.audiences.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className={ds.cn(ds.typography.caption, 'font-medium text-muted-foreground mb-2')}>Added:</div>
            <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
              {bulkAudiences.audiences.map((audience) => (
                <div
                  key={audience.id}
                  className={ds.cn(
                    ds.componentPresets.badge,
                    'bg-primary/10 text-primary',
                    'inline-flex items-center gap-1.5'
                  )}
                >
                  <span className={ds.typography.caption}>{audience.name}</span>
                  <Button
                    onClick={() => removeAudience(audience.id)}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors h-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {/* Placement Presets */}
      <FormSection title="Placement Presets">
        {/* Quick selection - Most used */}
        <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
          {PLACEMENT_PRESET_OPTIONS.filter(p => !p.category).map((preset) => (
            <Button
              key={preset.value}
              onClick={() => togglePlacementPreset(preset.value)}
              variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'secondary'}
              className={ds.cn(
                'px-3 py-1.5 rounded-full font-medium transition-all',
                ds.typography.caption
              )}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Expandable advanced options */}
        {bulkAudiences.placementPresets.length > 0 && (
          <Button
            onClick={() => setPlacementsExpanded(!placementsExpanded)}
            variant="ghost"
            className={ds.cn(
              'mt-3 flex items-center',
              ds.spacing.gap.sm,
              ds.typography.caption,
              'text-muted-foreground hover:text-foreground transition-colors h-auto p-0'
            )}
          >
            <ChevronDown className={ds.cn('h-3.5 w-3.5 transition-transform', placementsExpanded && 'rotate-180')} />
            {placementsExpanded ? 'Hide' : 'Show'} advanced options
          </Button>
        )}

        {placementsExpanded && (
          <div className={ds.cn('mt-3 pt-3 border-t border-border', ds.spacing.vertical.md)}>
            {/* Platform Split */}
            <div>
              <div className={ds.cn('text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2')}>By Platform</div>
              <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Platform').map((preset) => (
                  <Button
                    key={preset.value}
                    onClick={() => togglePlacementPreset(preset.value)}
                    variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'secondary'}
                    className={ds.cn(
                      'px-3 py-1.5 rounded-full font-medium transition-all',
                      ds.typography.caption
                    )}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Placement Type Split */}
            <div>
              <div className={ds.cn('text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2')}>By Placement Type</div>
              <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Placement').map((preset) => (
                  <Button
                    key={preset.value}
                    onClick={() => togglePlacementPreset(preset.value)}
                    variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'secondary'}
                    className={ds.cn(
                      'px-3 py-1.5 rounded-full font-medium transition-all',
                      ds.typography.caption
                    )}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormSection>

      {/* Geo Locations */}
      <FormSection title="Geo Locations *" icon={<Info className="h-4 w-4" />}>
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
            onClick={() => setGeoExpanded(!geoExpanded)}
            variant="ghost"
            className={ds.cn(
              'mt-3 flex items-center',
              ds.spacing.gap.sm,
              ds.typography.caption,
              'text-muted-foreground hover:text-foreground transition-colors h-auto p-0'
            )}
          >
            <ChevronDown className={ds.cn('h-3.5 w-3.5 transition-transform', geoExpanded && 'rotate-180')} />
            {geoExpanded ? 'Hide' : 'Show'} by type ({selectedGeoLocations.filter(l => l.type === 'country').length} countries, {selectedGeoLocations.filter(l => l.type === 'region').length} regions, {selectedGeoLocations.filter(l => l.type === 'city').length} cities)
          </Button>
        )}

        {geoExpanded && (
          <div className={ds.cn('mt-3 pt-3 border-t border-border', ds.spacing.vertical.md)}>
            {/* Countries */}
            {selectedGeoLocations.filter(l => l.type === 'country').length > 0 && (
              <div>
                <label className={ds.cn(ds.componentPresets.label, 'mb-2')}>Countries</label>
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
                <label className={ds.cn(ds.componentPresets.label, 'mb-2')}>Regions</label>
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
                <label className={ds.cn(ds.componentPresets.label, 'mb-2')}>Cities</label>
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
      </FormSection>

      {/* Demographics */}
      <FormSection title="Demographics">
        {/* Age Range and Gender */}
        <FormRow columns={2} gap="lg">
          {/* Age Range Slider - Dual Handle */}
          <div>
            <label className={ds.componentPresets.label}>Age Range</label>
            <div className="relative h-10 flex items-center mt-3">
              {/* Age labels above handles */}
              <div
                className={ds.cn(
                  'absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm',
                  ds.typography.caption,
                  'font-medium'
                )}
                style={{
                  left: `calc(${((bulkAudiences.demographics.ageMin - 13) / (65 - 13)) * 100}% - 12px)`,
                  transition: 'left 0.05s ease-out'
                }}
              >
                {bulkAudiences.demographics.ageMin}
              </div>
              <div
                className={ds.cn(
                  'absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm',
                  ds.typography.caption,
                  'font-medium'
                )}
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
            <label className={ds.componentPresets.label}>Gender</label>
            <div className={ds.cn('flex flex-wrap mt-2', ds.spacing.gap.sm)}>
              {['All', 'Male', 'Female'].map((gender) => (
                <Button
                  key={gender}
                  onClick={() =>
                    updateBulkAudiences({
                      demographics: { ...bulkAudiences.demographics, gender: gender as any },
                    })
                  }
                  variant={bulkAudiences.demographics.gender === gender ? 'default' : 'secondary'}
                  className={ds.cn(
                    'px-4 py-2 rounded-full font-medium transition-all',
                    ds.typography.body
                  )}
                >
                  {gender}
                </Button>
              ))}
            </div>
          </div>
        </FormRow>

        {/* Languages Dropdown */}
        <div>
          <Select
            label="Languages (optional)"
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
            hint="Target specific languages (optional)"
          />
        </div>
      </FormSection>

      {/* Optimization & Budget */}
      <FormSection title="Optimization & Budget">
        <FormRow columns={2} gap="md">
          <Select
            label="Optimization Event *"
            value={bulkAudiences.optimizationEvent}
            onChange={(val) => updateBulkAudiences({ optimizationEvent: val })}
            options={availableOptimizationEvents.map((event) => ({
              value: event,
              label: event.replace(/_/g, ' '),
            }))}
            required
            hint="How Facebook will optimize delivery"
          />

          {isABO && (
            <div>
              <label className={ds.componentPresets.label}>
                Budget per Ad Set (USD) *
              </label>
              <div className={ds.cn('flex', ds.spacing.gap.sm)}>
                <Select
                  value={bulkAudiences.budgetType || 'daily'}
                  onChange={(val) => updateBulkAudiences({ budgetType: val as any })}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'lifetime', label: 'Lifetime' },
                  ]}
                  className="w-24"
                />
                <Input
                  type="number"
                  min={5}
                  value={bulkAudiences.budgetPerAdSet?.toString() || ''}
                  onChange={(val) => updateBulkAudiences({ budgetPerAdSet: Number(val) })}
                  placeholder="50"
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {!isABO && (
            <div className={ds.cn('flex items-center rounded-lg border border-border bg-muted/30', ds.spacing.padding.sm, ds.spacing.gap.sm)}>
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className={ds.componentPresets.hint}>
                Budget managed at campaign level (CBO)
              </p>
            </div>
          )}
        </FormRow>

        {/* Pixel Conversion Event - Combined dropdown */}
        {facebookPixelId && (pixelEvents || customConversions) && (
          <div className={ds.cn('pt-2 border-t border-border', ds.spacing.vertical.md)}>
            <div>
              <label className={ds.componentPresets.label}>
                Événement de Conversion (optionnel)
              </label>
              <p className={ds.cn(ds.componentPresets.hint, 'mb-3')}>
                Sélectionner un événement pixel ou une conversion personnalisée
              </p>
            </div>

            <div className="relative">
              <select
                value={
                  bulkAudiences.customConversionId
                    ? `cc_${bulkAudiences.customConversionId}`
                    : bulkAudiences.customEventStr
                    ? `pe_${bulkAudiences.customEventStr}`
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    // Clear selection
                    updateBulkAudiences({
                      customEventType: undefined,
                      customEventStr: undefined,
                      customConversionId: undefined
                    })
                  } else if (value.startsWith('pe_')) {
                    // Pixel Event selected
                    const eventName = value.substring(3)
                    updateBulkAudiences({
                      customEventType: 'OTHER',
                      customEventStr: eventName,
                      customConversionId: undefined
                    })
                  } else if (value.startsWith('cc_')) {
                    // Custom Conversion selected
                    const conversionId = value.substring(3)
                    const conversion = customConversions?.find((c: any) => c.id === conversionId)
                    updateBulkAudiences({
                      customConversionId: conversionId,
                      customEventStr: conversion?.name,
                      customEventType: conversion?.custom_event_type || 'LEAD'
                    })
                  }
                }}
                className={ds.componentPresets.select}
              >
                <option value="">Aucun événement</option>

                {/* Pixel Events Section */}
                {pixelEvents && pixelEvents.length > 0 && (
                  <optgroup label="📊 Événements Pixel">
                    {pixelEvents.map((event: string) => (
                      <option key={`pe_${event}`} value={`pe_${event}`}>
                        {event}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Custom Conversions Section */}
                {customConversions && customConversions.length > 0 && (
                  <optgroup label="🎯 Custom Conversions">
                    {customConversions.map((conversion: any) => (
                      <option key={`cc_${conversion.id}`} value={`cc_${conversion.id}`}>
                        {conversion.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Badge label when an option is selected */}
              {(bulkAudiences.customConversionId || bulkAudiences.customEventStr) && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={ds.cn(
                    ds.componentPresets.badge,
                    ds.getBadgeColor(bulkAudiences.customConversionId ? 'purple' : 'blue')
                  )}>
                    {bulkAudiences.customConversionId ? 'Custom Conversion' : 'Pixel Event'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </FormSection>
    </div>
  )
}
