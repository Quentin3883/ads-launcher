'use client'

import { PLATFORM_CONFIG, type Platform } from '@/lib/types/strategy-workflow'
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Add Block:</span>
      <div className="flex items-center gap-2">
        {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleClick(key as Platform, config.available)}
            className={`
              px-3 py-2 rounded-lg border border-[#d9d8ce]
              flex items-center gap-2
              transition-all group
              ${
                config.available
                  ? 'hover:border-[#151515] hover:shadow-md bg-white cursor-pointer active:scale-95'
                  : 'opacity-50 cursor-not-allowed bg-gray-50'
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
          </button>
        ))}
      </div>
    </div>
  )
}
