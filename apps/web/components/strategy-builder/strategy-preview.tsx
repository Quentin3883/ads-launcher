'use client'

import { Layers, FolderOpen, FileText } from 'lucide-react'
import type { StrategyPreview } from '@/lib/types/strategy-builder'
import { PLATFORM_LABELS } from '@/lib/types/strategy-builder'

interface StrategyPreviewProps {
  preview: StrategyPreview
}

export function StrategyPreviewPanel({ preview }: StrategyPreviewProps) {
  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Strategy Preview</h3>
        <p className="text-sm text-muted-foreground">
          Estimated campaign structure based on your configuration
        </p>
      </div>

      {/* Grand Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Campaigns</span>
          </div>
          <div className="text-2xl font-bold text-primary">{preview.grandTotalCampaigns}</div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-blue-700" />
            <span className="text-xs font-medium text-blue-700">Ad Sets</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{preview.grandTotalAdSets}</div>
        </div>

        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-green-700" />
            <span className="text-xs font-medium text-green-700">Ads</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{preview.grandTotalAds}</div>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Breakdown by Stage</h4>
        {preview.stages.map((stage) => (
          <div key={stage.stageId} className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-sm font-semibold text-foreground">{stage.stageName}</h5>
                <p className="text-xs text-muted-foreground">
                  ${stage.budgetAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Campaigns</div>
                  <div className="font-semibold text-foreground">{stage.totalCampaigns}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Ad Sets</div>
                  <div className="font-semibold text-foreground">{stage.totalAdSets}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Ads</div>
                  <div className="font-semibold text-foreground">{stage.totalAds}</div>
                </div>
              </div>
            </div>

            {stage.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stage.platforms.map((platform) => (
                  <span
                    key={platform.platformId}
                    className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary"
                  >
                    {PLATFORM_LABELS[platform.platformId]}
                  </span>
                ))}
              </div>
            )}

            {stage.platforms.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No platforms enabled</p>
            )}
          </div>
        ))}
      </div>

      {/* Budget Distribution */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Budget Distribution</h4>
        <div className="space-y-2">
          {preview.stages.map((stage) => {
            const percentage = (stage.budgetAmount / preview.totalBudget) * 100

            return (
              <div key={stage.stageId}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{stage.stageName}</span>
                  <span className="text-muted-foreground">
                    ${stage.budgetAmount.toLocaleString()} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
