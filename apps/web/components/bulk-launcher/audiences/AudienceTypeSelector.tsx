import { Button, ds } from '../ui/shadcn'
import type { AudiencePresetType } from '@launcher-ads/sdk'

interface AudienceTypeSelectorProps {
  selectedType: AudiencePresetType
  onSelectType: (type: AudiencePresetType) => void
  onQuickAddBroad: () => void
}

const AUDIENCE_PRESET_TYPES: { value: AudiencePresetType; label: string; description: string }[] = [
  { value: 'BROAD', label: 'Broad', description: 'Wide reach, no targeting' },
  { value: 'INTEREST', label: 'Interests', description: 'Target by interests' },
  { value: 'LOOKALIKE', label: 'Lookalike', description: 'Similar to your audience' },
  { value: 'CUSTOM_AUDIENCE', label: 'Custom', description: 'Your own audience list' },
]

/**
 * Quick add buttons for audience types
 * Allows user to select the type of audience they want to create
 */
export function AudienceTypeSelector({
  selectedType,
  onSelectType,
  onQuickAddBroad,
}: AudienceTypeSelectorProps) {
  return (
    <div className={ds.cn('flex flex-wrap', ds.spacing.gap.sm)}>
      {AUDIENCE_PRESET_TYPES.map((type) => (
        <Button
          key={type.value}
          onClick={() => {
            onSelectType(type.value)
            // Auto-add Broad immediately (no form needed)
            if (type.value === 'BROAD') {
              onQuickAddBroad()
            }
          }}
          variant={selectedType === type.value ? 'default' : 'secondary'}
          className={ds.cn(
            'px-3 py-1.5 rounded-full font-medium transition-all',
            ds.typography.caption
          )}
        >
          + {type.label}
        </Button>
      ))}
    </div>
  )
}
