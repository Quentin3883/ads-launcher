import { Trash2, ChevronDown } from 'lucide-react'
import { Button, ds } from '../ui/shadcn'
import { CreativeSlot } from './CreativeSlot'
import type { Creative, CreativeLabel } from '@launcher-ads/sdk'

interface CreativeCardProps {
  creative: Creative
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateName: (name: string) => void
  onUpdateLabel: (label: CreativeLabel) => void
  onAssignFeedFile: (file: File) => void
  onAssignStoryFile: (file: File) => void
  onOpenFeedLibrary: (type: 'image' | 'video') => void
  onOpenStoryLibrary: (type: 'image' | 'video') => void
  onRemoveFeed: () => void
  onRemoveStory: () => void
  onDelete: () => void
  children?: React.ReactNode // For copy variants section
}

/**
 * Creative card component with name, labels, slots, and expandable copy section
 */
export function CreativeCard({
  creative,
  isExpanded,
  onToggleExpand,
  onUpdateName,
  onUpdateLabel,
  onAssignFeedFile,
  onAssignStoryFile,
  onOpenFeedLibrary,
  onOpenStoryLibrary,
  onRemoveFeed,
  onRemoveStory,
  onDelete,
  children,
}: CreativeCardProps) {
  const labels: CreativeLabel[] = ['Static', 'Video', 'UGC', 'Other']

  const labelColors: Record<CreativeLabel, string> = {
    Static: 'blue',
    Video: 'green',
    UGC: 'purple',
    Other: 'orange',
  }

  return (
    <div className={ds.cn('rounded-lg border border-border bg-card', ds.spacing.padding.sm)}>
      <div className={ds.cn('flex items-center', ds.spacing.gap.sm)}>
        {/* Creative Name */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={creative.name}
            onChange={(e) => onUpdateName(e.target.value)}
            className={ds.cn(
              'w-full px-2 py-1 font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded',
              ds.typography.caption
            )}
          />
        </div>

        {/* Label Pills */}
        <div className={ds.cn('flex', ds.spacing.gap.xs)}>
          {labels.map((label) => (
            <Button
              key={label}
              onClick={() => onUpdateLabel(label)}
              variant={creative.label === label ? 'default' : 'secondary'}
              size="sm"
              className={ds.cn(
                ds.componentPresets.badge,
                'font-medium transition-colors',
                creative.label === label && ds.getBadgeColor(labelColors[label])
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Feed Slot */}
        <CreativeSlot
          slot="feed"
          version={creative.feedVersion}
          format={creative.format}
          creativeId={creative.id}
          otherSlotFormat={creative.storyVersion ? creative.format : undefined}
          onAssignFile={onAssignFeedFile}
          onOpenLibrary={onOpenFeedLibrary}
          onRemove={onRemoveFeed}
        />

        {/* Story Slot */}
        <CreativeSlot
          slot="story"
          version={creative.storyVersion}
          format={creative.format}
          creativeId={creative.id}
          otherSlotFormat={creative.feedVersion ? creative.format : undefined}
          onAssignFile={onAssignStoryFile}
          onOpenLibrary={onOpenStoryLibrary}
          onRemove={onRemoveStory}
        />

        {/* Toggle Copy Fields */}
        <Button
          onClick={onToggleExpand}
          variant="ghost"
          size="sm"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors h-auto"
          title="Edit copy for this creative"
        >
          <ChevronDown className={ds.cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
        </Button>

        {/* Delete Creative */}
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expandable Content (Copy Fields, etc.) */}
      {isExpanded && children}
    </div>
  )
}
