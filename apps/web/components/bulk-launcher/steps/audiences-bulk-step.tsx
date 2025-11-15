// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CAMPAIGN_TYPE_OPTIMIZATION_EVENTS, OPTIMIZATION_EVENTS } from '@launcher-ads/sdk'
import { Info, X } from 'lucide-react'
import { GeoLocationAutocomplete } from '../components/geo-location-autocomplete'
import { trpc } from '@/lib/trpc'
import { FormSection, FormRow, Select, Input, ds, Button } from '../ui/shadcn'
import { useAudienceBuilder } from '../hooks/use-audience-builder'
import { AudienceTypeSelector } from '../audiences/AudienceTypeSelector'
import { AudienceForm } from '../audiences/AudienceForm'
import { PlacementSelector } from '../audiences/PlacementSelector'
import { DemographicsForm } from '../audiences/DemographicsForm'

export function AudiencesBulkStep() {
  const {
    campaign,
    bulkAudiences,
    updateBulkAudiences,
    removeAudience,
    togglePlacementPreset,
    getMatrixStats,
    adAccountId,
    facebookPixelId,
  } = useBulkLauncher()

  const [selectedGeoLocations, setSelectedGeoLocations] = useState<Array<{ key: string; name: string; type: string }>>([])

  // Use audience builder hook
  const audienceBuilder = useAudienceBuilder()

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
      <FormSection title="Audiences">
        {/* Help Text */}
        {bulkAudiences.audiences.length === 0 && (
          <div className={ds.cn(
            'mb-4 p-3 rounded-lg',
            'bg-blue-50 border border-blue-200',
            'flex items-start gap-2'
          )}>
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className={ds.cn(ds.typography.body, 'text-blue-900 font-medium')}>
                Add at least one audience
              </p>
              <p className={ds.cn(ds.typography.caption, 'text-blue-700 mt-0.5')}>
                Select an audience type below, configure it, then click "Add Audience" to include it in your campaign.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Select Type */}
        <div className={ds.spacing.vertical.sm}>
          <label className={ds.cn(ds.componentPresets.label, 'flex items-center gap-2')}>
            <span className={ds.cn(
              'inline-flex items-center justify-center w-5 h-5 rounded-full',
              'bg-primary text-primary-foreground text-xs font-bold'
            )}>1</span>
            Select Audience Type
          </label>
          <AudienceTypeSelector
            selectedType={audienceBuilder.newAudienceType}
            onSelectType={audienceBuilder.setNewAudienceType}
            onQuickAddBroad={audienceBuilder.handleQuickAddBroad}
          />
        </div>

        {/* Step 2: Configure (if not Broad) */}
        {audienceBuilder.newAudienceType !== 'BROAD' && (
          <div className={ds.spacing.vertical.sm}>
            <label className={ds.cn(ds.componentPresets.label, 'flex items-center gap-2')}>
              <span className={ds.cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full',
                'bg-primary text-primary-foreground text-xs font-bold'
              )}>2</span>
              Configure {audienceBuilder.newAudienceType === 'INTEREST' ? 'Interests' : audienceBuilder.newAudienceType === 'LOOKALIKE' ? 'Lookalike' : 'Custom Audience'}
            </label>
            <AudienceForm
              type={audienceBuilder.newAudienceType}
              userId={userId}
              selectedInterests={audienceBuilder.selectedInterests}
              onAddInterest={audienceBuilder.handleAddInterest}
              onRemoveInterest={audienceBuilder.handleRemoveInterest}
              lalSource={audienceBuilder.lalSource}
              lalPercentages={audienceBuilder.lalPercentages}
              onSetLalSource={audienceBuilder.setLalSource}
              onToggleLalPercentage={audienceBuilder.handleToggleLalPercentage}
              customAudienceId={audienceBuilder.customAudienceId}
              onSetCustomAudienceId={audienceBuilder.setCustomAudienceId}
              onAdd={audienceBuilder.handleAddAudience}
            />
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
        <PlacementSelector
          selectedPresets={bulkAudiences.placementPresets}
          onTogglePreset={togglePlacementPreset}
        />
      </FormSection>

      {/* Geo Locations */}
      <FormSection title="Geo Locations *" icon={<Info className="h-4 w-4" />}>
        <div>
          <GeoLocationAutocomplete
            value={selectedGeoLocations}
            onChange={(locs) => {
              setSelectedGeoLocations(locs)
              // Update bulk audiences
              updateBulkAudiences({
                geoLocations: {
                  countries: locs.filter((l) => l.type === 'country').map((l) => l.key),
                  regions: locs.filter((l) => l.type === 'region').map((l) => l.key),
                  cities: locs.filter((l) => l.type === 'city').map((l) => l.key),
                },
              })
            }}
            userId={userId}
            locationTypes={['country', 'region', 'city']}
            placeholder="Search countries, regions, or cities..."
          />
        </div>
      </FormSection>

      {/* Demographics */}
      <FormSection title="Demographics">
        <DemographicsForm
          ageMin={bulkAudiences.demographics.ageMin}
          ageMax={bulkAudiences.demographics.ageMax}
          gender={bulkAudiences.demographics.gender}
          languages={bulkAudiences.demographics.languages || []}
          onUpdateAge={(min, max) =>
            updateBulkAudiences({
              demographics: { ...bulkAudiences.demographics, ageMin: min, ageMax: max },
            })
          }
          onUpdateGender={(gender) =>
            updateBulkAudiences({
              demographics: { ...bulkAudiences.demographics, gender },
            })
          }
          onUpdateLanguages={(languages) =>
            updateBulkAudiences({
              demographics: { ...bulkAudiences.demographics, languages },
            })
          }
        />
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
              <label className={ds.componentPresets.label}>Budget per Ad Set (USD) *</label>
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
            <div
              className={ds.cn(
                'flex items-center rounded-lg border border-border bg-muted/30',
                ds.spacing.padding.sm,
                ds.spacing.gap.sm
              )}
            >
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className={ds.componentPresets.hint}>Budget managed at campaign level (CBO)</p>
            </div>
          )}
        </FormRow>

        {/* Pixel Conversion Event - Combined dropdown */}
        {facebookPixelId && (pixelEvents || customConversions) && (
          <div className={ds.cn('pt-2 border-t border-border', ds.spacing.vertical.md)}>
            <div>
              <label className={ds.componentPresets.label}>Événement de Conversion (optionnel)</label>
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
                      customConversionId: undefined,
                    })
                  } else if (value.startsWith('pe_')) {
                    // Pixel Event selected
                    const eventName = value.substring(3)
                    updateBulkAudiences({
                      customEventType: 'OTHER',
                      customEventStr: eventName,
                      customConversionId: undefined,
                    })
                  } else if (value.startsWith('cc_')) {
                    // Custom Conversion selected
                    const conversionId = value.substring(3)
                    const conversion = customConversions?.find((c: any) => c.id === conversionId)
                    updateBulkAudiences({
                      customConversionId: conversionId,
                      customEventStr: conversion?.name,
                      customEventType: conversion?.custom_event_type || 'LEAD',
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
                  <span
                    className={ds.cn(
                      ds.componentPresets.badge,
                      ds.getBadgeColor(bulkAudiences.customConversionId ? 'purple' : 'blue')
                    )}
                  >
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
