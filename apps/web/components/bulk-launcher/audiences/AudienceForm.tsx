import { Button, Input, ds } from '../ui/shadcn'
import { InterestAutocomplete } from '../components/interest-autocomplete'
import type { AudiencePresetType } from '@launcher-ads/sdk'

interface Interest {
  id: string
  name: string
}

interface AudienceFormProps {
  type: AudiencePresetType
  userId: string

  // Interest props
  selectedInterests: Interest[]
  onAddInterest: (interest: Interest) => void
  onRemoveInterest: (id: string) => void

  // LAL props
  lalSource: string
  lalPercentages: number[]
  onSetLalSource: (source: string) => void
  onToggleLalPercentage: (pct: number) => void

  // Custom props
  customAudienceId: string
  onSetCustomAudienceId: (id: string) => void

  // Submit
  onAdd: () => void
}

const LAL_PERCENTAGES = [1, 2, 3, 5, 10]

/**
 * Conditional forms for each audience type
 * Shows the appropriate form based on the selected type
 */
export function AudienceForm({
  type,
  userId,
  selectedInterests,
  onAddInterest,
  onRemoveInterest,
  lalSource,
  lalPercentages,
  onSetLalSource,
  onToggleLalPercentage,
  customAudienceId,
  onSetCustomAudienceId,
  onAdd,
}: AudienceFormProps) {
  // Don't show form for BROAD (auto-added)
  if (type === 'BROAD') {
    return null
  }

  // Interest form
  if (type === 'INTEREST') {
    return (
      <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
        <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>
          Add Interest Audience
        </div>
        <InterestAutocomplete
          userId={userId}
          selectedInterests={selectedInterests}
          onAdd={onAddInterest}
          onRemove={onRemoveInterest}
          placeholder="Search interests..."
        />
        {selectedInterests.length > 0 && (
          <Button
            onClick={onAdd}
            className={ds.cn('w-full px-3 py-1.5 rounded-lg', ds.typography.caption)}
          >
            Add ({selectedInterests.length} interests)
          </Button>
        )}
      </div>
    )
  }

  // Lookalike form
  if (type === 'LOOKALIKE') {
    return (
      <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
        <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>
          Add Lookalike Audience
        </div>
        <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
          <Input
            value={lalSource}
            onChange={onSetLalSource}
            placeholder="LAL Source"
            className={ds.typography.caption}
          />
          <div className={ds.cn('flex flex-wrap', ds.spacing.gap.xs)}>
            {LAL_PERCENTAGES.map((pct) => (
              <Button
                key={pct}
                onClick={() => onToggleLalPercentage(pct)}
                variant={lalPercentages.includes(pct) ? 'default' : 'secondary'}
                className={ds.cn('px-2 py-1 rounded', ds.typography.caption)}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>
        <Button
          onClick={onAdd}
          className={ds.cn('w-full px-3 py-1.5 rounded-lg', ds.typography.caption)}
        >
          Add Lookalike
        </Button>
      </div>
    )
  }

  // Custom audience form
  if (type === 'CUSTOM_AUDIENCE') {
    return (
      <div className={ds.cn('mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5', ds.spacing.vertical.sm)}>
        <div className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>
          Add Custom Audience
        </div>
        <Input
          value={customAudienceId}
          onChange={onSetCustomAudienceId}
          placeholder="Custom Audience ID"
          className={ds.cn('w-full', ds.typography.caption)}
        />
        <Button
          onClick={onAdd}
          className={ds.cn('w-full px-3 py-1.5 rounded-lg', ds.typography.caption)}
        >
          Add Custom Audience
        </Button>
      </div>
    )
  }

  return null
}
