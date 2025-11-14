'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLACEMENT_PRESETS, type PlacementPreset } from '@launcher-ads/sdk'

const PLACEMENT_PRESET_OPTIONS: { value: PlacementPreset; label: string; placements: string[] }[] =
  [
    { value: 'FEEDS_REELS', label: 'Feeds + Reels', placements: PLACEMENT_PRESETS.FEEDS_REELS },
    { value: 'STORIES_ONLY', label: 'Stories Only', placements: PLACEMENT_PRESETS.STORIES_ONLY },
    {
      value: 'ALL_PLACEMENTS',
      label: 'All Placements',
      placements: PLACEMENT_PRESETS.ALL_PLACEMENTS,
    },
  ]

interface PlacementSelectorProps {
  selectedPresets: PlacementPreset[]
  onToggle: (preset: PlacementPreset) => void
}

export function PlacementSelector({ selectedPresets, onToggle }: PlacementSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placement Presets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {PLACEMENT_PRESET_OPTIONS.map((preset) => (
            <Button
              key={preset.value}
              onClick={() => onToggle(preset.value)}
              variant={selectedPresets.includes(preset.value) ? 'default' : 'outline'}
              className="p-4 h-auto flex-col items-start text-left"
            >
              <div className="font-semibold text-sm">
                {preset.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {preset.placements.join(', ')}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
