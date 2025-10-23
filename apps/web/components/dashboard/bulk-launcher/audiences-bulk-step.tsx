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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() =>
                    setSelectedInterests((prev) =>
                      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedInterests.includes(interest)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {newAudienceType === 'LOOKALIKE' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                LAL Source
              </label>
              <input
                type="text"
                value={lalSource}
                onChange={(e) => setLalSource(e.target.value)}
                placeholder="e.g., Website Visitors 30D"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                LAL %
              </label>
              <div className="flex flex-wrap gap-2">
                {LAL_PERCENTAGES.map((pct) => (
                  <button
                    key={pct}
                    onClick={() =>
                      setLalPercentages((prev) =>
                        prev.includes(pct) ? prev.filter((p) => p !== pct) : [...prev, pct]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      lalPercentages.includes(pct)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {newAudienceType === 'CUSTOM_AUDIENCE' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Custom Audience ID
            </label>
            <input
              type="text"
              value={customAudienceId}
              onChange={(e) => setCustomAudienceId(e.target.value)}
              placeholder="e.g., 123456789"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
            />
          </div>
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
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          Geo Locations *
          <Info className="h-4 w-4 text-muted-foreground" />
        </h4>

        {/* Countries */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">Countries</label>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <button
                key={country}
                onClick={() => handleGeoToggle('countries', country)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  bulkAudiences.geoLocations.countries.includes(country)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        {availableRegions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Regions (optional)</label>
            <div className="flex flex-wrap gap-2">
              {availableRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleGeoToggle('regions', region)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    bulkAudiences.geoLocations.regions?.includes(region)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {availableCities.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Cities (optional)</label>
            <div className="flex flex-wrap gap-2">
              {availableCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleGeoToggle('cities', city)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    bulkAudiences.geoLocations.cities?.includes(city)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demographics */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Demographics</h4>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Age Min</label>
            <input
              type="number"
              min="13"
              max="65"
              value={bulkAudiences.demographics.ageMin}
              onChange={(e) =>
                updateBulkAudiences({
                  demographics: { ...bulkAudiences.demographics, ageMin: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Age Max</label>
            <input
              type="number"
              min="13"
              max="65"
              value={bulkAudiences.demographics.ageMax}
              onChange={(e) =>
                updateBulkAudiences({
                  demographics: { ...bulkAudiences.demographics, ageMax: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
            <select
              value={bulkAudiences.demographics.gender}
              onChange={(e) =>
                updateBulkAudiences({
                  demographics: { ...bulkAudiences.demographics, gender: e.target.value as any },
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Languages (optional)</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageToggle(language)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  bulkAudiences.demographics.languages?.includes(language)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optimization & Budget */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Optimization & Budget</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Optimization Event *</label>
            <select
              value={bulkAudiences.optimizationEvent}
              onChange={(e) => updateBulkAudiences({ optimizationEvent: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {OPTIMIZATION_EVENTS.map((event) => (
                <option key={event} value={event}>
                  {event.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {isABO && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget per Ad Set (USD) *</label>
              <div className="flex gap-2">
                <select
                  value={bulkAudiences.budgetType || 'daily'}
                  onChange={(e) => updateBulkAudiences({ budgetType: e.target.value as any })}
                  className="w-24 px-2 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                <input
                  type="number"
                  min="5"
                  value={bulkAudiences.budgetPerAdSet || ''}
                  onChange={(e) => updateBulkAudiences({ budgetPerAdSet: Number(e.target.value) })}
                  placeholder="50"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
      </div>
    </div>
  )
}
