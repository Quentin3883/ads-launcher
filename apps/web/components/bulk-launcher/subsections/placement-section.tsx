'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { PLACEMENT_PRESETS, type PlacementPreset, LANGUAGES } from '@launcher-ads/sdk'
import { ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select } from '../ui/shadcn'
import { cn } from '@/lib/utils'

const PLACEMENT_PRESET_OPTIONS: { value: PlacementPreset; label: string; placements: string[]; category?: string }[] = [
  { value: 'ALL_PLACEMENTS', label: 'All Placements', placements: PLACEMENT_PRESETS.ALL_PLACEMENTS },
  { value: 'FEEDS_REELS', label: 'Feeds + Reels', placements: PLACEMENT_PRESETS.FEEDS_REELS },
  { value: 'STORIES_ONLY', label: 'Stories Only', placements: PLACEMENT_PRESETS.STORIES_ONLY },
  { value: 'FACEBOOK_ONLY', label: 'Facebook Only', placements: PLACEMENT_PRESETS.FACEBOOK_ONLY, category: 'Platform' },
  { value: 'INSTAGRAM_ONLY', label: 'Instagram Only', placements: PLACEMENT_PRESETS.INSTAGRAM_ONLY, category: 'Platform' },
  { value: 'FEED_ONLY', label: 'Feed Only', placements: PLACEMENT_PRESETS.FEED_ONLY, category: 'Placement' },
  { value: 'REELS_ONLY', label: 'Reels Only', placements: PLACEMENT_PRESETS.REELS_ONLY, category: 'Placement' },
]

export function PlacementSection() {
  const { bulkAudiences, togglePlacementPreset, updateBulkAudiences } = useBulkLauncher()
  const [placementsExpanded, setPlacementsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Placement & Demographics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick selection - Most used */}
        <div className="flex flex-wrap gap-2">
          {PLACEMENT_PRESET_OPTIONS.filter(p => !p.category).map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              onClick={() => togglePlacementPreset(preset.value)}
              variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'outline'}
              className="rounded-full h-auto py-1.5 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Expandable advanced options */}
        {bulkAudiences.placementPresets.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPlacementsExpanded(!placementsExpanded)}
            className="mt-3 h-auto py-0 text-xs"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform mr-2', placementsExpanded && 'rotate-180')} />
            {placementsExpanded ? 'Hide' : 'Show'} advanced options
          </Button>
        )}

        {placementsExpanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-4">
            {/* Platform Split */}
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By Platform</div>
              <div className="flex flex-wrap gap-2">
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Platform').map((preset) => (
                  <Button
                    key={preset.value}
                    size="sm"
                    onClick={() => togglePlacementPreset(preset.value)}
                    variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'outline'}
                    className="rounded-full h-auto py-1.5 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Placement Type Split */}
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By Placement Type</div>
              <div className="flex flex-wrap gap-2">
                {PLACEMENT_PRESET_OPTIONS.filter(p => p.category === 'Placement').map((preset) => (
                  <Button
                    key={preset.value}
                    size="sm"
                    onClick={() => togglePlacementPreset(preset.value)}
                    variant={bulkAudiences.placementPresets.includes(preset.value) ? 'default' : 'outline'}
                    className="rounded-full h-auto py-1.5 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Demographics Section */}
        <div className="pt-6 border-t border-border space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Demographics</h3>

          {/* Age Range and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Range Slider - Dual Handle */}
            <div>
              <Label>Age Range</Label>
              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {bulkAudiences.demographics.ageMin} - {bulkAudiences.demographics.ageMax === 65 ? '65+' : bulkAudiences.demographics.ageMax}
                  </span>
                </div>
                <Slider
                  min={13}
                  max={65}
                  step={1}
                  value={[bulkAudiences.demographics.ageMin, bulkAudiences.demographics.ageMax]}
                  onValueChange={([min, max]) =>
                    updateBulkAudiences({
                      demographics: {
                        ...bulkAudiences.demographics,
                        ageMin: min,
                        ageMax: max
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Gender Selection (Pills) */}
            <div>
              <Label>Gender</Label>
              <div className="flex flex-wrap mt-2 gap-2">
                {['All', 'Male', 'Female'].map((gender) => (
                  <Button
                    key={gender}
                    size="sm"
                    onClick={() =>
                      updateBulkAudiences({
                        demographics: { ...bulkAudiences.demographics, gender: gender as any },
                      })
                    }
                    variant={bulkAudiences.demographics.gender === gender ? 'default' : 'outline'}
                    className="rounded-full h-auto py-1.5 text-xs"
                  >
                    {gender}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Languages Dropdown */}
          <div>
            <Select
              label="Languages (optional)"
              value={(bulkAudiences.demographics.languages || [])[0] || 'none'}
              onChange={(val) =>
                updateBulkAudiences({
                  demographics: { ...bulkAudiences.demographics, languages: val === 'none' ? [] : [val] },
                })
              }
              options={[
                { value: 'none', label: 'No language targeting' },
                ...LANGUAGES.map(lang => ({ value: lang, label: lang }))
              ]}
              hint="Target specific languages (optional)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
