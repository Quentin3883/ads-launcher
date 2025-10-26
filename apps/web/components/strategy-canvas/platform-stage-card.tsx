'use client'

import { Trash2, GripVertical } from 'lucide-react'
import type { PlatformStageBlock } from '@/lib/types/strategy-canvas'
import { PLATFORM_CONFIG, META_OBJECTIVES } from '@/lib/types/strategy-canvas'

interface PlatformStageCardProps {
  block: PlatformStageBlock
  totalBudget: number
  onEdit: () => void
  onDelete: () => void
  isDragging?: boolean
}

export function PlatformStageCard({
  block,
  totalBudget,
  onEdit,
  onDelete,
  isDragging = false,
}: PlatformStageCardProps) {
  const platformConfig = PLATFORM_CONFIG[block.platform]
  const objectiveConfig = block.platform === 'meta' ? META_OBJECTIVES[block.objective as keyof typeof META_OBJECTIVES] : null
  const amount = (totalBudget * block.budgetPercentage) / 100

  return (
    <div
      className={`
        group relative bg-white rounded-lg border border-[#d9d8ce] p-4
        hover:shadow-md transition-all cursor-pointer
        ${!block.enabled ? 'opacity-50' : ''}
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${!platformConfig.available ? 'bg-gray-50' : ''}
      `}
      onClick={onEdit}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-[#151515]/30" />
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>

      <div className="space-y-3">
        {/* Platform Header */}
        <div className="flex items-center gap-2 pr-6">
          <span className="text-xl">{platformConfig.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#151515] text-sm">{platformConfig.label}</div>
            {!platformConfig.available && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded bg-yellow-100 text-yellow-800">
                SOON
              </span>
            )}
          </div>
        </div>

        {/* Objective */}
        {objectiveConfig && (
          <div className="text-xs text-[#151515]/60">
            {objectiveConfig.label}
          </div>
        )}

        {/* Budget */}
        <div className="pt-3 border-t border-[#d9d8ce]">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-[#151515]/60">Budget</span>
            <div className="text-right">
              <div className="text-lg font-bold text-[#151515]">{block.budgetPercentage}%</div>
              <div className="text-xs text-[#151515]/60">${amount.toLocaleString()}</div>
            </div>
          </div>

          {/* Budget Bar */}
          <div className="h-1.5 bg-[#edece5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(block.budgetPercentage, 100)}%`,
                backgroundColor: platformConfig.color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
