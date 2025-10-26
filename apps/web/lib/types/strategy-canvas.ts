/**
 * Strategy Canvas Types
 * Visual canvas with 3 funnel columns and platform stage blocks
 */

// Funnel Stages
export type FunnelStage = 'awareness' | 'consideration' | 'conversion'

export const FUNNEL_STAGES: Record<FunnelStage, { label: string; description: string; color: string }> = {
  awareness: {
    label: 'Awareness',
    description: 'Reach new audiences',
    color: '#3B82F6', // blue
  },
  consideration: {
    label: 'Consideration',
    description: 'Drive engagement & interest',
    color: '#8B5CF6', // purple
  },
  conversion: {
    label: 'Conversion',
    description: 'Generate leads & sales',
    color: '#10B981', // green
  },
}

// Platform options
export type Platform = 'meta' | 'google' | 'linkedin' | 'tiktok'

export const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; available: boolean; color: string; icon: string }
> = {
  meta: { label: 'Meta Ads', available: true, color: '#0084FF', icon: '📘' },
  google: { label: 'Google Ads', available: false, color: '#4285F4', icon: '🔍' },
  linkedin: { label: 'LinkedIn Ads', available: false, color: '#0A66C2', icon: '💼' },
  tiktok: { label: 'TikTok Ads', available: false, color: '#000000', icon: '🎵' },
}

// Campaign objectives per platform
export type MetaObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

export const META_OBJECTIVES: Record<MetaObjective, { label: string; stage: FunnelStage }> = {
  AWARENESS: { label: 'Brand Awareness', stage: 'awareness' },
  TRAFFIC: { label: 'Traffic', stage: 'consideration' },
  ENGAGEMENT: { label: 'Engagement', stage: 'consideration' },
  LEADS: { label: 'Lead Generation', stage: 'conversion' },
  APP_PROMOTION: { label: 'App Promotion', stage: 'consideration' },
  SALES: { label: 'Sales', stage: 'conversion' },
}

// Platform Stage Block
export interface PlatformStageBlock {
  id: string
  platform: Platform
  objective: string // Platform-specific objective (e.g., MetaObjective)
  budgetPercentage: number // % of total strategy budget
  stage: FunnelStage
  enabled: boolean
  config?: Record<string, any> // Additional platform-specific config
}

// Strategy Canvas
export interface StrategyCanvas {
  id: string
  name: string
  description?: string
  totalBudget: number
  budgetType: 'daily' | 'lifetime'
  startDate: string
  endDate: string
  stages: {
    awareness: PlatformStageBlock[]
    consideration: PlatformStageBlock[]
    conversion: PlatformStageBlock[]
  }
  createdAt: string
  updatedAt: string
}

// Budget Distribution Summary
export interface BudgetDistribution {
  stage: FunnelStage
  totalPercentage: number
  totalAmount: number
  platforms: Array<{
    platform: Platform
    objective: string
    percentage: number
    amount: number
  }>
}

// Calculate budget distribution by stage
export function calculateBudgetDistribution(canvas: StrategyCanvas): BudgetDistribution[] {
  const distribution: BudgetDistribution[] = []

  Object.entries(canvas.stages).forEach(([stageKey, blocks]) => {
    const stage = stageKey as FunnelStage
    const enabledBlocks = blocks.filter((block) => block.enabled)

    const totalPercentage = enabledBlocks.reduce((sum, block) => sum + block.budgetPercentage, 0)
    const totalAmount = (canvas.totalBudget * totalPercentage) / 100

    const platforms = enabledBlocks.map((block) => ({
      platform: block.platform,
      objective: block.objective,
      percentage: block.budgetPercentage,
      amount: (canvas.totalBudget * block.budgetPercentage) / 100,
    }))

    distribution.push({
      stage,
      totalPercentage,
      totalAmount,
      platforms,
    })
  })

  return distribution
}

// Calculate total percentage used
export function calculateTotalPercentage(canvas: StrategyCanvas): number {
  let total = 0
  Object.values(canvas.stages).forEach((blocks) => {
    blocks.forEach((block) => {
      if (block.enabled) {
        total += block.budgetPercentage
      }
    })
  })
  return total
}

// Validate canvas
export function validateCanvas(canvas: StrategyCanvas): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  const totalPercentage = calculateTotalPercentage(canvas)

  if (totalPercentage > 100) {
    errors.push('Total budget allocation exceeds 100%')
  }

  if (totalPercentage < 100) {
    warnings.push(`${100 - totalPercentage}% of budget is unallocated`)
  }

  // Check if at least one platform is enabled
  const hasEnabledPlatforms = Object.values(canvas.stages).some((blocks) =>
    blocks.some((block) => block.enabled)
  )

  if (!hasEnabledPlatforms) {
    errors.push('At least one platform must be enabled')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Create default platform stage block
export function createDefaultPlatformBlock(
  stage: FunnelStage,
  platform: Platform = 'meta'
): PlatformStageBlock {
  // Find a default objective for this stage
  let objective = 'AWARENESS'
  if (platform === 'meta') {
    const defaultObjective = Object.entries(META_OBJECTIVES).find(
      ([_, config]) => config.stage === stage
    )
    if (defaultObjective) {
      objective = defaultObjective[0]
    }
  }

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    platform,
    objective,
    budgetPercentage: 10,
    stage,
    enabled: true,
    config: {},
  }
}
