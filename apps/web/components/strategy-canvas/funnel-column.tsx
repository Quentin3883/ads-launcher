'use client'

import { Plus } from 'lucide-react'
import type { FunnelStage, PlatformStageBlock } from '@/lib/types/strategy-canvas'
import { FUNNEL_STAGES } from '@/lib/types/strategy-canvas'
import { PlatformStageCard } from './platform-stage-card'

interface FunnelColumnProps {
  stage: FunnelStage
  blocks: PlatformStageBlock[]
  totalBudget: number
  onAddBlock: () => void
  onEditBlock: (block: PlatformStageBlock) => void
  onDeleteBlock: (blockId: string) => void
}

export function FunnelColumn({
  stage,
  blocks,
  totalBudget,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
}: FunnelColumnProps) {
  const stageConfig = FUNNEL_STAGES[stage]

  // Calculate total percentage for this stage
  const stagePercentage = blocks
    .filter((b) => b.enabled)
    .reduce((sum, b) => sum + b.budgetPercentage, 0)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Column Header */}
      <div className="px-6 py-4 border-b border-[#d9d8ce] bg-white/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[#151515] text-lg">{stageConfig.label}</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#151515]">{stagePercentage}%</div>
            <div className="text-xs text-[#151515]/60">
              ${((totalBudget * stagePercentage) / 100).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#151515]/60 mb-3">{stageConfig.description}</p>

        {/* Stage Budget Bar */}
        <div className="h-2 bg-[#edece5] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(stagePercentage, 100)}%`,
              backgroundColor: stageConfig.color,
            }}
          />
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[#edece5]/30">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#d9d8ce] rounded-lg bg-white/50">
            <p className="text-sm text-[#151515]/40">No platforms added yet</p>
          </div>
        ) : (
          blocks.map((block) => (
            <PlatformStageCard
              key={block.id}
              block={block}
              totalBudget={totalBudget}
              onEdit={() => onEditBlock(block)}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))
        )}

        {/* Add Block Button */}
        <button
          onClick={onAddBlock}
          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-[#d9d8ce] bg-white/50 hover:bg-white hover:border-[#151515]/20 transition-all group"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4 text-[#151515]/40 group-hover:text-[#151515]/60" />
            <span className="text-sm font-medium text-[#151515]/40 group-hover:text-[#151515]/60">
              Add Platform
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
