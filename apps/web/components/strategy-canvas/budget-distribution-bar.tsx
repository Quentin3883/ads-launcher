'use client'

import type { StrategyCanvas } from '@/lib/types/strategy-canvas'
import { calculateBudgetDistribution, FUNNEL_STAGES } from '@/lib/types/strategy-canvas'

interface BudgetDistributionBarProps {
  canvas: StrategyCanvas
}

export function BudgetDistributionBar({ canvas }: BudgetDistributionBarProps) {
  const distribution = calculateBudgetDistribution(canvas)

  // Calculate total used percentage
  const totalPercentage = distribution.reduce((sum, d) => sum + d.totalPercentage, 0)
  const remainingPercentage = 100 - totalPercentage

  return (
    <div className="bg-white rounded-lg border border-[#d9d8ce] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#151515]">Budget Distribution</h3>
        <div className="text-right">
          <div className="text-sm text-[#151515]/60">Total Allocated</div>
          <div className="text-2xl font-bold text-[#151515]">{totalPercentage}%</div>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="relative h-12 bg-[#edece5] rounded-lg overflow-hidden">
        {distribution.map((dist, idx) => {
          const stageConfig = FUNNEL_STAGES[dist.stage]
          const offsetPercentage = distribution
            .slice(0, idx)
            .reduce((sum, d) => sum + d.totalPercentage, 0)

          return (
            <div
              key={dist.stage}
              className="absolute top-0 bottom-0 transition-all group cursor-pointer"
              style={{
                left: `${offsetPercentage}%`,
                width: `${dist.totalPercentage}%`,
                backgroundColor: stageConfig.color,
              }}
            >
              {dist.totalPercentage > 10 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-xs font-semibold">
                    {dist.totalPercentage}%
                  </div>
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#151515] text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-semibold">{stageConfig.label}</div>
                <div className="text-white/70">${dist.totalAmount.toLocaleString()}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#151515]" />
              </div>
            </div>
          )
        })}

        {/* Remaining/Unallocated */}
        {remainingPercentage > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-[#edece5] border-l-2 border-[#d9d8ce]"
            style={{
              left: `${totalPercentage}%`,
              width: `${remainingPercentage}%`,
            }}
          >
            {remainingPercentage > 15 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#151515]/40 text-xs font-semibold">
                  {remainingPercentage}% unallocated
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 gap-4">
        {distribution.map((dist) => {
          const stageConfig = FUNNEL_STAGES[dist.stage]
          return (
            <div key={dist.stage} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stageConfig.color }}
              />
              <div>
                <div className="text-xs font-medium text-[#151515]">{stageConfig.label}</div>
                <div className="text-[10px] text-[#151515]/60">
                  ${dist.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}

        {remainingPercentage > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 rounded-full bg-[#edece5] border border-[#d9d8ce]" />
            <div>
              <div className="text-xs font-medium text-[#151515]/60">Unallocated</div>
              <div className="text-[10px] text-[#151515]/40">
                ${((canvas.totalBudget * remainingPercentage) / 100).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
