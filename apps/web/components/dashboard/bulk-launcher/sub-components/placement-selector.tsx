'use client'

import { SectionCard } from '@/components/ui/section-card'
import { PLACEMENT_PRESETS, type PlacementPreset } from '@/lib/types/bulk-launcher'

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
    <SectionCard title="Placement Presets">
      <div className="grid grid-cols-3 gap-3">
        {PLACEMENT_PRESET_OPTIONS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onToggle(preset.value)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedPresets.includes(preset.value)
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:border-primary/50'
            }`}
          >
            <div
              className={`font-semibold text-sm ${
                selectedPresets.includes(preset.value) ? 'text-primary' : 'text-foreground'
              }`}
            >
              {preset.label}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {preset.placements.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
