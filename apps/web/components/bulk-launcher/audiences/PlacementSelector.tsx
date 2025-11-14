import { useState } from 'react'
import { Button, ds } from '../ui/shadcn'
import { ChevronDown } from 'lucide-react'
import { PLACEMENT_PRESETS, type PlacementPreset } from '@launcher-ads/sdk'

interface PlacementSelectorProps {
  selectedPresets: PlacementPreset[]
  onTogglePreset: (preset: PlacementPreset) => void
}

const PLACEMENT_PRESET_OPTIONS: { value: PlacementPreset; label: string; placements: string[]; category?: string }[] = [
  { value: 'ALL_PLACEMENTS', label: 'All Placements', placements: PLACEMENT_PRESETS.ALL_PLACEMENTS },
  { value: 'FEEDS_REELS', label: 'Feeds + Reels', placements: PLACEMENT_PRESETS.FEEDS_REELS },
  { value: 'STORIES_ONLY', label: 'Stories Only', placements: PLACEMENT_PRESETS.STORIES_ONLY },
  { value: 'FACEBOOK_ONLY', label: 'Facebook Only', placements: PLACEMENT_PRESETS.FACEBOOK_ONLY, category: 'Platform' },
  { value: 'INSTAGRAM_ONLY', label: 'Instagram Only', placements: PLACEMENT_PRESETS.INSTAGRAM_ONLY, category: 'Platform' },
  { value: 'FEED_ONLY', label: 'Feed Only', placements: PLACEMENT_PRESETS.FEED_ONLY, category: 'Placement' },
  { value: 'REELS_ONLY', label: 'Reels Only', placements: PLACEMENT_PRESETS.REELS_ONLY, category: 'Placement' },
]

/**
 * Placement presets selector with expandable advanced options
 * Allows quick selection of common placement combinations
 */
export function PlacementSelector({ selectedPresets, onTogglePreset }: PlacementSelectorProps) {
  const [placementsExpanded, setPlacementsExpanded] = useState(false)

  return (
    <div>
      {/* Quick selection - Most used */}
      <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
        {PLACEMENT_PRESET_OPTIONS.filter((p) => !p.category).map((preset) => (
          <Button
            key={preset.value}
            onClick={() => onTogglePreset(preset.value)}
            variant={selectedPresets.includes(preset.value) ? 'default' : 'secondary'}
            className={ds.cn('px-3 py-1.5 rounded-full font-medium transition-all', ds.typography.caption)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Expandable advanced options */}
      {selectedPresets.length > 0 && (
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
          <ChevronDown
            className={ds.cn('h-3.5 w-3.5 transition-transform', placementsExpanded && 'rotate-180')}
          />
          {placementsExpanded ? 'Hide' : 'Show'} advanced options
        </Button>
      )}

      {placementsExpanded && (
        <div className={ds.cn('mt-3 pt-3 border-t border-border', ds.spacing.vertical.md)}>
          {/* Platform Split */}
          <div>
            <div
              className={ds.cn(
                'text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2'
              )}
            >
              By Platform
            </div>
            <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
              {PLACEMENT_PRESET_OPTIONS.filter((p) => p.category === 'Platform').map((preset) => (
                <Button
                  key={preset.value}
                  onClick={() => onTogglePreset(preset.value)}
                  variant={selectedPresets.includes(preset.value) ? 'default' : 'secondary'}
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
            <div
              className={ds.cn(
                'text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2'
              )}
            >
              By Placement Type
            </div>
            <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
              {PLACEMENT_PRESET_OPTIONS.filter((p) => p.category === 'Placement').map((preset) => (
                <Button
                  key={preset.value}
                  onClick={() => onTogglePreset(preset.value)}
                  variant={selectedPresets.includes(preset.value) ? 'default' : 'secondary'}
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
    </div>
  )
}
