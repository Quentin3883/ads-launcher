/**
 * Strategy Builder V2 - Modular Dimension-based Strategy Builder
 * Support for pre-established and custom dimensions with flexible combination rules
 */

// ========== PLATFORMS ==========
export type Platform = 'meta' | 'google' | 'linkedin' | 'tiktok'

export const PLATFORM_CONFIG: Record<Platform, {
  label: string
  available: boolean
  color: string
  icon: string
}> = {
  meta: { label: 'Meta Ads', available: true, color: '#0084FF', icon: '📘' },
  google: { label: 'Google Ads', available: false, color: '#4285F4', icon: '🔍' },
  linkedin: { label: 'LinkedIn Ads', available: false, color: '#0A66C2', icon: '💼' },
  tiktok: { label: 'TikTok Ads', available: false, color: '#000000', icon: '🎵' },
}

// ========== FUNNEL STAGES ==========
export type FunnelStage = 'awareness' | 'consideration' | 'conversion'

export const FUNNEL_STAGES: Record<FunnelStage, {
  label: string
  description: string
  color: string
  defaultBudgetShare: number
}> = {
  awareness: {
    label: 'Awareness',
    description: 'Reach new audiences',
    color: '#3B82F6',
    defaultBudgetShare: 10,
  },
  consideration: {
    label: 'Consideration',
    description: 'Drive engagement',
    color: '#8B5CF6',
    defaultBudgetShare: 25,
  },
  conversion: {
    label: 'Conversion',
    description: 'Generate leads & sales',
    color: '#10B981',
    defaultBudgetShare: 65,
  },
}

// ========== META OBJECTIVES ==========
export type MetaObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

export const META_OBJECTIVES: Record<MetaObjective, {
  label: string
  stage: FunnelStage
}> = {
  AWARENESS: { label: 'Brand Awareness', stage: 'awareness' },
  TRAFFIC: { label: 'Traffic', stage: 'consideration' },
  ENGAGEMENT: { label: 'Engagement', stage: 'consideration' },
  LEADS: { label: 'Lead Generation', stage: 'conversion' },
  APP_PROMOTION: { label: 'App Promotion', stage: 'consideration' },
  SALES: { label: 'Sales', stage: 'conversion' },
}

// ========== DIMENSIONS ==========

export type DimensionType =
  | 'funnel_stage'      // Pre-established: Awareness/Consideration/Conversion
  | 'region'            // Pre-established: Geographic regions
  | 'audience_type'     // Pre-established: Broad/Interest/LAL/Custom
  | 'value_proposition' // Custom: Different product values
  | 'job_category'      // Custom: Job types for recruiting
  | 'customer_segment'  // Custom: B2B/B2C/Enterprise/SMB...
  | 'creative_variant'  // Custom: Different creative approaches
  | 'custom'            // Fully custom dimension

export type DimensionScope = 'global' | 'per_stage' | 'per_platform'

export type CombinationMode =
  | 'full_factorial'    // All combinations (dimensions × dimensions)
  | 'pairwise'          // Each level paired once
  | 'one_per_adset'     // 1 level = 1 adset (for creative testing)
  | 'custom'            // Manual combination rules

// Variable placeholder - values filled in Launcher
export interface DimensionVariable {
  id: string              // e.g., "var_1", "var_2"
  label: string           // e.g., "PV #1", "Region #1"
  weight?: number         // Budget weighting (optional)
}

export interface Dimension {
  id: string
  type: DimensionType
  label: string           // e.g., "Value Proposition", "Region"
  description?: string
  scope: DimensionScope
  combinationMode: CombinationMode
  variableCount: number   // How many variables (e.g., 5 PVs, 3 regions)
  variables: DimensionVariable[]  // Placeholders to be filled in Launcher
  applyToStages?: FunnelStage[]   // If scope = per_stage, which stages?
  applyToPlatforms?: Platform[]    // If scope = per_platform, which platforms?
  enabled: boolean
  isTemplate: boolean     // true = pre-established, false = custom
}

// Pre-established dimension templates
export const DIMENSION_TEMPLATES: Record<string, Omit<Dimension, 'id'>> = {
  funnel_stage: {
    type: 'funnel_stage',
    label: 'Funnel Stage',
    description: 'Customer journey stages',
    scope: 'global',
    combinationMode: 'full_factorial',
    enabled: false,
    isTemplate: true,
    variableCount: 3,
    variables: [
      { id: 'var_1', label: 'Stage #1', weight: 10 },
      { id: 'var_2', label: 'Stage #2', weight: 25 },
      { id: 'var_3', label: 'Stage #3', weight: 65 },
    ],
  },
  region: {
    type: 'region',
    label: 'Region',
    description: 'Geographic targeting',
    scope: 'global',
    combinationMode: 'full_factorial',
    enabled: false,
    isTemplate: true,
    variableCount: 3,
    variables: [
      { id: 'var_1', label: 'Region #1', weight: 40 },
      { id: 'var_2', label: 'Region #2', weight: 35 },
      { id: 'var_3', label: 'Region #3', weight: 25 },
    ],
  },
  audience_type: {
    type: 'audience_type',
    label: 'Audience Type',
    description: 'Targeting strategy',
    scope: 'per_stage',
    combinationMode: 'pairwise',
    enabled: false,
    isTemplate: true,
    variableCount: 4,
    variables: [
      { id: 'var_1', label: 'Audience #1' },
      { id: 'var_2', label: 'Audience #2' },
      { id: 'var_3', label: 'Audience #3' },
      { id: 'var_4', label: 'Audience #4' },
    ],
  },
  value_proposition: {
    type: 'value_proposition',
    label: 'Value Proposition',
    description: 'Different product values to test',
    scope: 'global',
    combinationMode: 'full_factorial',
    enabled: false,
    isTemplate: true,
    variableCount: 3,
    variables: [
      { id: 'var_1', label: 'PV #1', weight: 33 },
      { id: 'var_2', label: 'PV #2', weight: 33 },
      { id: 'var_3', label: 'PV #3', weight: 34 },
    ],
  },
  job_category: {
    type: 'job_category',
    label: 'Job Category',
    description: 'Job types for recruiting campaigns',
    scope: 'global',
    combinationMode: 'full_factorial',
    enabled: false,
    isTemplate: true,
    variableCount: 5,
    variables: [
      { id: 'var_1', label: 'Category #1', weight: 30 },
      { id: 'var_2', label: 'Category #2', weight: 25 },
      { id: 'var_3', label: 'Category #3', weight: 20 },
      { id: 'var_4', label: 'Category #4', weight: 15 },
      { id: 'var_5', label: 'Category #5', weight: 10 },
    ],
  },
  creative_variant: {
    type: 'creative_variant',
    label: 'Creative Variant',
    description: 'Different creative approaches',
    scope: 'per_stage',
    combinationMode: 'one_per_adset',
    enabled: false,
    isTemplate: true,
    variableCount: 3,
    variables: [
      { id: 'var_1', label: 'Creative #1' },
      { id: 'var_2', label: 'Creative #2' },
      { id: 'var_3', label: 'Creative #3' },
    ],
  },
}

// ========== STRATEGY STRUCTURE ==========

export interface Strategy {
  id: string
  name: string
  description?: string

  // Platform & Objective (single selection for now)
  platform: Platform
  objective: MetaObjective

  // Dimensions (modular structure)
  dimensions: Dimension[]

  // Metadata
  createdAt: string
  updatedAt: string
}

// ========== CAMPAIGN MATRIX ==========

export interface CampaignBlueprint {
  id: string
  name: string
  platform: Platform
  objective: MetaObjective
  dimensionValues: Record<string, string>  // dimensionId -> variableId
  estimatedAdSets: number
  estimatedAds: number
}

export interface MatrixCalculationResult {
  totalCampaigns: number
  totalAdSets: number
  totalAds: number
  campaigns: CampaignBlueprint[]
}

// ========== CALCULATION FUNCTIONS ==========

/**
 * Calculate campaign matrix based on strategy dimensions and combination rules
 */
export function calculateCampaignMatrix(strategy: Strategy): MatrixCalculationResult {
  const campaigns: CampaignBlueprint[] = []

  const enabledDimensions = strategy.dimensions.filter(d => d.enabled)

  // Get all active dimension combinations
  const combinations = generateDimensionCombinations(enabledDimensions)

  // Generate one campaign per combination
  combinations.forEach((combo) => {
    campaigns.push({
      id: `campaign_${campaigns.length + 1}`,
      name: generateCampaignName(strategy.platform, combo, enabledDimensions),
      platform: strategy.platform,
      objective: strategy.objective,
      dimensionValues: combo,
      estimatedAdSets: estimateAdSets(enabledDimensions, combo),
      estimatedAds: estimateAds(enabledDimensions, combo),
    })
  })

  return {
    totalCampaigns: campaigns.length,
    totalAdSets: campaigns.reduce((sum, c) => sum + c.estimatedAdSets, 0),
    totalAds: campaigns.reduce((sum, c) => sum + c.estimatedAds, 0),
    campaigns,
  }
}

function generateDimensionCombinations(dimensions: Dimension[]): Record<string, string>[] {
  if (dimensions.length === 0) return [{}]

  const globalDimensions = dimensions.filter(d => d.scope === 'global' && d.enabled)

  // For full_factorial mode
  const fullFactorialDims = globalDimensions.filter(d => d.combinationMode === 'full_factorial')

  if (fullFactorialDims.length === 0) return [{}]

  // Generate all combinations
  const combinations: Record<string, string>[] = [{}]

  fullFactorialDims.forEach(dimension => {
    const variables = dimension.variables
    const newCombinations: Record<string, string>[] = []

    combinations.forEach(combo => {
      variables.forEach(variable => {
        newCombinations.push({
          ...combo,
          [dimension.id]: variable.id,
        })
      })
    })

    combinations.length = 0
    combinations.push(...newCombinations)
  })

  return combinations
}

function generateCampaignName(
  platform: Platform,
  combo: Record<string, string>,
  dimensions: Dimension[]
): string {
  const parts = [PLATFORM_CONFIG[platform].label]

  Object.entries(combo).forEach(([dimId, varId]) => {
    const dimension = dimensions.find(d => d.id === dimId)
    const variable = dimension?.variables.find(v => v.id === varId)
    if (variable) {
      parts.push(variable.label)
    }
  })

  return parts.join(' - ')
}

function estimateAdSets(_dimensions: Dimension[], _combo: Record<string, string>): number {
  // Simplified: 3 ad sets per campaign
  return 3
}

function estimateAds(_dimensions: Dimension[], _combo: Record<string, string>): number {
  // Simplified: 3 ads per ad set
  return 9
}

// ========== VALIDATION ==========

export function validateStrategy(strategy: Strategy): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if at least one dimension is enabled
  const enabledDimensions = strategy.dimensions.filter(d => d.enabled)
  if (enabledDimensions.length === 0) {
    warnings.push('No dimensions enabled - add dimensions to create campaign variations')
  }

  // Check if dimensions have variables
  enabledDimensions.forEach(dim => {
    if (dim.variables.length === 0) {
      errors.push(`Dimension "${dim.label}" has no variables defined`)
    }
  })

  // Check if platform is available
  if (!PLATFORM_CONFIG[strategy.platform].available) {
    errors.push(`Platform ${PLATFORM_CONFIG[strategy.platform].label} is not available yet`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
