'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Target, Users, Zap, TrendingUp } from 'lucide-react'
import type { StrategyStage, PlatformId } from '@/lib/types/strategy-builder'
import {
  PLATFORM_LABELS,
  META_OBJECTIVE_LABELS,
  AUDIENCE_TYPE_LABELS,
  COMBINATION_RULE_LABELS,
} from '@/lib/types/strategy-builder'
import { useStrategyBuilder } from '@/lib/store/strategy-builder'

interface StrategyStageCardProps {
  stage: StrategyStage
  totalBudget: number
}

const STAGE_ICONS = {
  awareness: Target,
  consideration: Users,
  conversion: Zap,
}

const STAGE_COLORS = {
  awareness: 'bg-blue-50 border-blue-200 text-blue-900',
  consideration: 'bg-purple-50 border-purple-200 text-purple-900',
  conversion: 'bg-green-50 border-green-200 text-green-900',
}

export function StrategyStageCard({ stage, totalBudget }: StrategyStageCardProps) {
  const [expanded, setExpanded] = useState(true)
  const {
    updateStageBudgetShare,
    togglePlatform,
    updateMetaObjective,
    updateMetaAudienceTypes,
    updateMetaCombinationRule,
    updateMetaEstimates,
  } = useStrategyBuilder()

  const Icon = STAGE_ICONS[stage.stage]
  const budgetAmount = (totalBudget * stage.budgetShare) / 100

  const metaPlatform = stage.platforms.find((p) => p.platformId === 'meta')
  const metaOptions = metaPlatform?.metaOptions

  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-md overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 border-b-2 border-border flex items-center justify-between ${STAGE_COLORS[stage.stage]}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-semibold">{stage.label}</h3>
            <p className="text-sm opacity-75">
              ${budgetAmount.toLocaleString()} ({stage.budgetShare}%)
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Budget Share Slider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Budget Allocation
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={stage.budgetShare}
                onChange={(e) => updateStageBudgetShare(stage.id, Number(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={stage.budgetShare}
                onChange={(e) => updateStageBudgetShare(stage.id, Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm text-center rounded border border-border bg-background"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Platforms</label>
            <div className="grid grid-cols-2 gap-3">
              {stage.platforms.map((platform) => {
                const isActive = platform.status === 'active'
                const isSoon = platform.status === 'soon'

                return (
                  <button
                    key={platform.platformId}
                    onClick={() => isActive && togglePlatform(stage.id, platform.platformId)}
                    disabled={isSoon}
                    className={`relative px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      platform.enabled
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-foreground hover:border-primary/50'
                    } ${isSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-sm">{PLATFORM_LABELS[platform.platformId]}</div>
                    {isSoon && (
                      <span className="absolute top-1 right-1 px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                        SOON
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Meta Configuration */}
          {metaPlatform?.enabled && metaOptions && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Meta Configuration
              </h4>

              {/* Objective */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Campaign Objective
                </label>
                <select
                  value={metaOptions.objective}
                  onChange={(e) => updateMetaObjective(stage.id, e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(META_OBJECTIVE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience Types */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Audience Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(AUDIENCE_TYPE_LABELS).map(([value, label]) => {
                    const isSelected = metaOptions.audienceTypes.includes(value as any)
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          const newTypes = isSelected
                            ? metaOptions.audienceTypes.filter((t) => t !== value)
                            : [...metaOptions.audienceTypes, value as any]
                          if (newTypes.length > 0) {
                            updateMetaAudienceTypes(stage.id, newTypes)
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Combination Rule */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Combination Rule
                </label>
                <select
                  value={metaOptions.combinationRule}
                  onChange={(e) => updateMetaCombinationRule(stage.id, e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(COMBINATION_RULE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Est. Audiences
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={metaOptions.estimatedAudiences || 1}
                    onChange={(e) =>
                      updateMetaEstimates(
                        stage.id,
                        Number(e.target.value),
                        metaOptions.estimatedCreatives || 1
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Est. Creatives
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={metaOptions.estimatedCreatives || 1}
                    onChange={(e) =>
                      updateMetaEstimates(
                        stage.id,
                        metaOptions.estimatedAudiences || 1,
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
