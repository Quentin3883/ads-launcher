'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import {
  COUNTRIES,
  REGIONS,
  CITIES,
  INTERESTS_OPTIONS,
  LANGUAGES,
  OPTIMIZATION_EVENTS,
  PLACEMENT_PRESETS,
  generateId,
} from '@/lib/types/bulk-launcher'
import type { AudiencePreset, AudiencePresetType, PlacementPreset } from '@/lib/types/bulk-launcher'
import { Plus, Trash2, List, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FormField } from '@/components/ui/form-field'
import { FormSelect } from '@/components/ui/form-select'
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { SectionCard } from '@/components/ui/section-card'

const AUDIENCE_PRESET_TYPES: { value: AudiencePresetType; label: string; description: string }[] = [
  { value: 'BROAD', label: 'Broad', description: 'Wide reach, no targeting' },
  { value: 'INTEREST', label: 'Interests', description: 'Target by interests' },
  { value: 'LOOKALIKE', label: 'Lookalike', description: 'Similar to your audience' },
  { value: 'CUSTOM_AUDIENCE', label: 'Custom', description: 'Your own audience list' },
]

const PLACEMENT_PRESET_OPTIONS: { value: PlacementPreset; label: string; placements: string[] }[] = [
  { value: 'FEEDS_REELS', label: 'Feeds + Reels', placements: PLACEMENT_PRESETS.FEEDS_REELS },
  { value: 'STORIES_ONLY', label: 'Stories Only', placements: PLACEMENT_PRESETS.STORIES_ONLY },
  { value: 'ALL_PLACEMENTS', label: 'All Placements', placements: PLACEMENT_PRESETS.ALL_PLACEMENTS },
]

const LAL_PERCENTAGES = [1, 2, 3, 5, 10]

export function AudiencesBulkStep() {
  const { campaign, bulkAudiences, updateBulkAudiences, addAudience, removeAudience, togglePlacementPreset, getMatrixStats } = useBulkLauncher()
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [bulkPasteText, setBulkPasteText] = useState('')
  const [newAudienceType, setNewAudienceType] = useState<AudiencePresetType>('BROAD')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [lalSource, setLalSource] = useState('')
  const [lalPercentages, setLalPercentages] = useState<number[]>([1])
  const [customAudienceId, setCustomAudienceId] = useState('')

  const isABO = campaign.budgetMode === 'ABO'
  const stats = getMatrixStats()

  const handleAddAudience = () => {
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
          name: `Interests: ${selectedInterests.slice(0, 2).join(', ')}${selectedInterests.length > 2 ? '...' : ''}`,
          interests: selectedInterests,
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
  }

  const handleBulkPasteInterests = () => {
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
  }

  const handleGeoToggle = (type: 'countries' | 'regions' | 'cities', value: string) => {
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
  }

  const handleLanguageToggle = (language: string) => {
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
  }

  const selectedCountry = bulkAudiences.geoLocations.countries[0]
  const availableRegions = selectedCountry ? REGIONS[selectedCountry] || [] : []
  const availableCities = selectedCountry ? CITIES[selectedCountry] || [] : []

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

      {/* Audience Builder */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-foreground">Audiences ({bulkAudiences.audiences.length})</h4>
          <button
            onClick={() => setShowBulkPaste(!showBulkPaste)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
          >
            <List className="h-4 w-4" />
            Bulk Paste
          </button>
        </div>

        {/* Bulk Paste */}
        <AnimatePresence>
          {showBulkPaste && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <textarea
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder="Paste interests (one per line)&#10;Shopping&#10;Fashion&#10;Technology"
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm font-mono resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkPasteInterests}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  Add All as Separate Audiences
                </button>
                <button
                  onClick={() => setShowBulkPaste(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audience Type Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Audience Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AUDIENCE_PRESET_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setNewAudienceType(type.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  newAudienceType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className={`font-medium text-sm ${
                  newAudienceType === type.value ? 'text-primary' : 'text-foreground'
                }`}>
                  {type.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Fields */}
        {newAudienceType === 'INTEREST' && (
          <ToggleButtonGroup
            label="Select Interests"
            items={INTERESTS_OPTIONS}
            selectedItems={selectedInterests}
            onToggle={(interest) =>
              setSelectedInterests((prev) =>
                prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
              )
            }
          />
        )}

        {newAudienceType === 'LOOKALIKE' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="LAL Source"
              value={lalSource}
              onChange={setLalSource}
              placeholder="e.g., Website Visitors 30D"
            />
            <ToggleButtonGroup
              label="LAL %"
              items={LAL_PERCENTAGES.map((p) => `${p}%`)}
              selectedItems={lalPercentages.map((p) => `${p}%`)}
              onToggle={(pct) => {
                const num = parseInt(pct)
                setLalPercentages((prev) =>
                  prev.includes(num) ? prev.filter((p) => p !== num) : [...prev, num]
                )
              }}
            />
          </div>
        )}

        {newAudienceType === 'CUSTOM_AUDIENCE' && (
          <FormField
            label="Custom Audience ID"
            value={customAudienceId}
            onChange={setCustomAudienceId}
            placeholder="e.g., 123456789"
          />
        )}

        <button
          onClick={handleAddAudience}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          Add Audience
        </button>

        {/* Audiences List */}
        {bulkAudiences.audiences.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">Added Audiences:</h5>
            <div className="space-y-2">
              {bulkAudiences.audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{audience.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{audience.type.toLowerCase()}</div>
                  </div>
                  <button
                    onClick={() => removeAudience(audience.id)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Placement Presets */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Placement Presets</h4>
        <div className="grid grid-cols-3 gap-3">
          {PLACEMENT_PRESET_OPTIONS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => togglePlacementPreset(preset.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                bulkAudiences.placementPresets.includes(preset.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <div className={`font-semibold text-sm ${
                bulkAudiences.placementPresets.includes(preset.value) ? 'text-primary' : 'text-foreground'
              }`}>
                {preset.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {preset.placements.join(', ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Geo Locations */}
      <SectionCard
        title="Geo Locations *"
        icon={Info}
      >
        <ToggleButtonGroup
          label="Countries"
          items={COUNTRIES}
          selectedItems={bulkAudiences.geoLocations.countries}
          onToggle={(country) => handleGeoToggle('countries', country)}
          size="sm"
        />

        {availableRegions.length > 0 && (
          <ToggleButtonGroup
            label="Regions (optional)"
            items={availableRegions}
            selectedItems={bulkAudiences.geoLocations.regions || []}
            onToggle={(region) => handleGeoToggle('regions', region)}
            size="sm"
          />
        )}

        {availableCities.length > 0 && (
          <ToggleButtonGroup
            label="Cities (optional)"
            items={availableCities}
            selectedItems={bulkAudiences.geoLocations.cities || []}
            onToggle={(city) => handleGeoToggle('cities', city)}
            size="sm"
          />
        )}
      </SectionCard>

      {/* Demographics */}
      <SectionCard title="Demographics">
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="Age Min"
            type="number"
            min={13}
            max={65}
            value={bulkAudiences.demographics.ageMin}
            onChange={(val) =>
              updateBulkAudiences({
                demographics: { ...bulkAudiences.demographics, ageMin: Number(val) },
              })
            }
          />
          <FormField
            label="Age Max"
            type="number"
            min={13}
            max={65}
            value={bulkAudiences.demographics.ageMax}
            onChange={(val) =>
              updateBulkAudiences({
                demographics: { ...bulkAudiences.demographics, ageMax: Number(val) },
              })
            }
          />
          <FormSelect
            label="Gender"
            value={bulkAudiences.demographics.gender}
            onChange={(val) =>
              updateBulkAudiences({
                demographics: { ...bulkAudiences.demographics, gender: val as any },
              })
            }
            options={['All', 'Male', 'Female']}
          />
        </div>

        <ToggleButtonGroup
          label="Languages (optional)"
          items={LANGUAGES}
          selectedItems={bulkAudiences.demographics.languages || []}
          onToggle={handleLanguageToggle}
        />
      </SectionCard>

      {/* Optimization & Budget */}
      <SectionCard title="Optimization & Budget">
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Optimization Event *"
            value={bulkAudiences.optimizationEvent}
            onChange={(val) => updateBulkAudiences({ optimizationEvent: val })}
            options={OPTIMIZATION_EVENTS.map((event) => ({
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
