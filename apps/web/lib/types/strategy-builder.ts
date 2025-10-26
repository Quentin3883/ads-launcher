/**
 * Strategy Builder Types
 * Multi-platform advertising strategy configuration
 */

// Platform identifiers
export type PlatformId = 'meta' | 'google' | 'linkedin' | 'tiktok'

export type PlatformStatus = 'active' | 'soon'

// Funnel stages
export type FunnelStage = 'awareness' | 'consideration' | 'conversion'

// Meta-specific types
export type MetaObjective = 'REACH' | 'TRAFFIC' | 'CONVERSIONS' | 'ENGAGEMENT' | 'LEADS'

export type AudienceType = 'BROAD' | 'INTEREST' | 'LAL' | 'CUSTOM'

export type CombinationRule = 'FULL_FACTORIAL' | 'ONE_CREATIVE_PER_ADSET' | 'CUSTOM'

// Platform configuration
export interface MetaPlatformOptions {
  objective: MetaObjective
  audienceTypes: AudienceType[]
  combinationRule: CombinationRule
  estimatedAudiences?: number
  estimatedCreatives?: number
}

export interface PlatformConfig {
  platformId: PlatformId
  status: PlatformStatus
  enabled: boolean
  // Options are platform-specific
  metaOptions?: MetaPlatformOptions
  // Future: googleOptions, linkedinOptions, tiktokOptions
}

// Strategy stage
export interface StrategyStage {
  id: string
  stage: FunnelStage
  label: string
  budgetShare: number // Percentage (0-100)
  platforms: PlatformConfig[]
}

// Main strategy blueprint
export interface StrategyBlueprint {
  id: string
  name: string
  totalBudget: number
  currency: string
  stages: StrategyStage[]
  createdAt: string
  updatedAt: string
}

// Preview calculations
export interface StagePreview {
  stageId: string
  stageName: string
  budgetAmount: number
  platforms: {
    platformId: PlatformId
    campaigns: number
    adSets: number
    ads: number
  }[]
  totalCampaigns: number
  totalAdSets: number
  totalAds: number
}

export interface StrategyPreview {
  strategyId: string
  totalBudget: number
  stages: StagePreview[]
  grandTotalCampaigns: number
  grandTotalAdSets: number
  grandTotalAds: number
}

// Calculation helpers
export function calculateMetaCombinations(options: MetaPlatformOptions): {
  adSets: number
  ads: number
} {
  const { audienceTypes, combinationRule, estimatedAudiences = 1, estimatedCreatives = 1 } = options

  const audiences = estimatedAudiences || audienceTypes.length
  const creatives = estimatedCreatives

  if (combinationRule === 'FULL_FACTORIAL') {
    return {
      adSets: audiences,
      ads: audiences * creatives,
    }
  }

  if (combinationRule === 'ONE_CREATIVE_PER_ADSET') {
    return {
      adSets: Math.max(audiences, creatives),
      ads: Math.max(audiences, creatives),
    }
  }

  // CUSTOM: user-defined logic (not implemented yet)
  return {
    adSets: audiences,
    ads: creatives,
  }
}

export function calculateStagePreview(
  stage: StrategyStage,
  totalBudget: number
): StagePreview {
  const budgetAmount = (totalBudget * stage.budgetShare) / 100

  const platforms = stage.platforms
    .filter((p) => p.enabled && p.status === 'active')
    .map((platform) => {
      if (platform.platformId === 'meta' && platform.metaOptions) {
        const { adSets, ads } = calculateMetaCombinations(platform.metaOptions)
        return {
          platformId: platform.platformId,
          campaigns: 1, // 1 campaign per stage per platform
          adSets,
          ads,
        }
      }

      // Future platforms
      return {
        platformId: platform.platformId,
        campaigns: 0,
        adSets: 0,
        ads: 0,
      }
    })

  const totalCampaigns = platforms.reduce((sum, p) => sum + p.campaigns, 0)
  const totalAdSets = platforms.reduce((sum, p) => sum + p.adSets, 0)
  const totalAds = platforms.reduce((sum, p) => sum + p.ads, 0)

  return {
    stageId: stage.id,
    stageName: stage.label,
    budgetAmount,
    platforms,
    totalCampaigns,
    totalAdSets,
    totalAds,
  }
}

export function calculateStrategyPreview(blueprint: StrategyBlueprint): StrategyPreview {
  const stages = blueprint.stages.map((stage) =>
    calculateStagePreview(stage, blueprint.totalBudget)
  )

  const grandTotalCampaigns = stages.reduce((sum, s) => sum + s.totalCampaigns, 0)
  const grandTotalAdSets = stages.reduce((sum, s) => sum + s.totalAdSets, 0)
  const grandTotalAds = stages.reduce((sum, s) => sum + s.totalAds, 0)

  return {
    strategyId: blueprint.id,
    totalBudget: blueprint.totalBudget,
    stages,
    grandTotalCampaigns,
    grandTotalAdSets,
    grandTotalAds,
  }
}

// Default values
export const DEFAULT_META_OPTIONS: MetaPlatformOptions = {
  objective: 'TRAFFIC',
  audienceTypes: ['BROAD'],
  combinationRule: 'FULL_FACTORIAL',
  estimatedAudiences: 1,
  estimatedCreatives: 3,
}

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  linkedin: 'LinkedIn Ads',
  tiktok: 'TikTok Ads',
}

export const STAGE_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
}

export const META_OBJECTIVE_LABELS: Record<MetaObjective, string> = {
  REACH: 'Reach',
  TRAFFIC: 'Traffic',
  CONVERSIONS: 'Conversions',
  ENGAGEMENT: 'Engagement',
  LEADS: 'Leads',
}

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  BROAD: 'Broad',
  INTEREST: 'Interest-based',
  LAL: 'Lookalike',
  CUSTOM: 'Custom',
}

export const COMBINATION_RULE_LABELS: Record<CombinationRule, string> = {
  FULL_FACTORIAL: 'Full Factorial (All combinations)',
  ONE_CREATIVE_PER_ADSET: '1 Creative per Ad Set',
  CUSTOM: 'Custom Rules',
}
