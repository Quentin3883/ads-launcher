'use client'

import { PLATFORM_CONFIG, type Platform } from '@/lib/types/workflow'
import { Plus } from 'lucide-react'
import Image from 'next/image'

interface PlatformSidebarProps {
  onAddBlock?: (platform: Platform) => void
}

export function PlatformSidebar({ onAddBlock }: PlatformSidebarProps) {
  const handleClick = (platform: Platform, available: boolean) => {
    if (available && onAddBlock) {
      onAddBlock(platform)
    }
  }

  const handleDragStart = (e: React.DragEvent, platform: Platform) => {
    e.dataTransfer.setData('platform', platform)
    e.dataTransfer.setData('isNewBlock', 'true')
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Add Block:</span>
      <div className="flex items-center gap-2">
        {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleClick(key as Platform, config.available)}
            draggable={config.available}
            onDragStart={(e) => config.available && handleDragStart(e, key as Platform)}
            className={`
              px-3 py-1.5 rounded-lg border
              flex items-center gap-2
              transition-all group backdrop-blur-sm
              ${
                config.available && !config.launcherReady
                  ? 'border-dashed border-gray-300 bg-white/60 hover:bg-white/80 hover:border-gray-400 cursor-grab active:cursor-grabbing active:scale-95'
                  : config.available
                    ? 'border-gray-200 bg-white/60 hover:bg-white/80 hover:border-gray-300 cursor-grab active:cursor-grabbing active:scale-95'
                    : 'border-gray-200 opacity-50 cursor-not-allowed bg-gray-100/60'
              }
            `}
            disabled={!config.available}
          >
            <div className="w-5 h-5 flex-shrink-0 relative">
              <Image
                src={`/${key}-logo.svg`}
                alt={`${config.label} logo`}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-medium text-[#151515]">{config.label}</span>
            {config.available && (
              <Plus className="h-4 w-4 text-[#151515] flex-shrink-0" />
            )}
            {config.available && !config.launcherReady && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
