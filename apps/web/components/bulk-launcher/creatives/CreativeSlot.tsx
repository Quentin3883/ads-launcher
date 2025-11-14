import { useState } from 'react'
import { Monitor, Smartphone, X } from 'lucide-react'
import { Button, ds } from '../ui/shadcn'
import type { CreativeVersion } from '@launcher-ads/sdk'

interface CreativeSlotProps {
  slot: 'feed' | 'story'
  version?: CreativeVersion
  format: 'Image' | 'Video'
  creativeId: string
  otherSlotFormat?: 'Image' | 'Video'
  onAssignFile: (file: File) => void
  onOpenLibrary: (type: 'image' | 'video') => void
  onRemove: () => void
}

/**
 * Reusable creative slot component for Feed or Story
 * Handles preview, upload dropdown, and remove functionality
 */
export function CreativeSlot({
  slot,
  version,
  format,
  creativeId,
  otherSlotFormat,
  onAssignFile,
  onOpenLibrary,
  onRemove,
}: CreativeSlotProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isFeed = slot === 'feed'
  const slotLabel = isFeed ? 'Feed' : 'Story'
  const SlotIcon = isFeed ? Monitor : Smartphone
  const sizeClasses = isFeed ? 'w-12 h-12' : 'w-7 h-12'

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]
      if (file) {
        onAssignFile(file)
        setIsDropdownOpen(false)
      }
    }
    input.click()
  }

  const handleLibraryClick = () => {
    // Determine media type based on existing format from other slot, or default to image
    const mediaType = otherSlotFormat === 'Video' ? 'video' : format === 'Video' ? 'video' : 'image'
    onOpenLibrary(mediaType)
    setIsDropdownOpen(false)
  }

  // Render preview if version exists
  if (version) {
    return (
      <div className="relative group">
        <div className={`${sizeClasses} rounded border border-border overflow-hidden bg-muted`}>
          {format === 'Video' ? (
            version.thumbnail?.startsWith('http') ? (
              <img src={version.thumbnail} className="w-full h-full object-cover" alt={slotLabel} />
            ) : (
              <video src={version.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            )
          ) : (
            <img src={version.thumbnail || version.url} alt={slotLabel} className="w-full h-full object-cover" />
          )}
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-auto p-0"
          >
            <X className={`${isFeed ? 'h-3 w-3' : 'h-2.5 w-2.5'} text-white`} />
          </Button>
        </div>
      </div>
    )
  }

  // Render upload button with dropdown if no version
  return (
    <div className="relative">
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        variant="outline"
        className={`${sizeClasses} rounded border-2 border-dashed cursor-pointer flex flex-col items-center justify-center p-1`}
      >
        <SlotIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={ds.cn(ds.typography.caption, 'text-muted-foreground')}>{slotLabel}</span>
      </Button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
          <Button
            onClick={handleFileSelect}
            variant="ghost"
            className={ds.cn('w-full text-left px-3 py-2 cursor-pointer rounded-t-lg justify-start', ds.typography.caption)}
          >
            Computer
          </Button>
          <Button
            onClick={handleLibraryClick}
            variant="ghost"
            className={ds.cn('w-full text-left px-3 py-2 rounded-b-lg justify-start', ds.typography.caption)}
          >
            Library
          </Button>
        </div>
      )}
    </div>
  )
}
