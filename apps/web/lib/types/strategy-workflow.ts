/**
 * Strategy Workflow - 3-column visual strategy builder
 * Simple layout with automatic column placement based on objective
 */

// ========== BASE TYPES ==========

export type Platform = 'meta' | 'google' | 'linkedin' | 'tiktok' | 'snapchat'

export type MetaObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

export type FunnelStage = 'awareness' | 'consideration' | 'conversion'

// ========== DIMENSION PER NODE ==========

export interface NodeDimension {
  id: string
  type: 'value_proposition' | 'region' | 'audience' | 'creative' | 'custom'
  label: string
  variableCount: number
  variables: {
    id: string
    label: string
    weight?: number
  }[]
  combinationMode: 'multiply' | 'separate'  // multiply = combinaisons, separate = 1 campaign par variable
}

// ========== AUDIENCE TYPES ==========

export type AudienceType = 'broad' | 'interest' | 'custom'

export interface AudienceConfig {
  type: AudienceType
  count: number  // Number of audiences of this type
}

// ========== NODE DATA ==========

export interface CampaignNodeData {
  type: 'campaign'
  label: string
  stage?: FunnelStage
  platform: Platform
  objective: MetaObjective
  dimensions: NodeDimension[]
  multiplier: number  // Ex: "2 campaigns" même sans dimensions
  audiences: AudienceConfig[]  // Audience configuration
  onDelete?: (nodeId: string) => void  // Callback for node deletion
}

// ========== PLATFORM & OBJECTIVE CONFIGS ==========

export const PLATFORM_CONFIG: Record<Platform, {
  label: string
  available: boolean
  color: string
}> = {
  meta: { label: 'Meta Ads', available: true, color: '#0084FF' },
  google: { label: 'Google Ads', available: false, color: '#4285F4' },
  linkedin: { label: 'LinkedIn Ads', available: false, color: '#0A66C2' },
  tiktok: { label: 'TikTok Ads', available: false, color: '#000000' },
  snapchat: { label: 'Snapchat Ads', available: false, color: '#FFFC00' },
}

export const META_OBJECTIVES: Record<MetaObjective, { label: string }> = {
  AWARENESS: { label: 'Brand Awareness' },
  TRAFFIC: { label: 'Traffic' },
  ENGAGEMENT: { label: 'Engagement' },
  LEADS: { label: 'Lead Generation' },
  APP_PROMOTION: { label: 'App Promotion' },
  SALES: { label: 'Sales' },
}

export const FUNNEL_STAGES: Record<FunnelStage, { label: string; color: string }> = {
  awareness: { label: 'Awareness', color: '#3B82F6' },
  consideration: { label: 'Consideration', color: '#8B5CF6' },
  conversion: { label: 'Conversion', color: '#10B981' },
}

export const AUDIENCE_TYPES: Record<AudienceType, { label: string; description: string; icon: string }> = {
  broad: {
    label: 'Broad',
    description: 'Large general audience',
    icon: '🌐'
  },
  interest: {
    label: 'Interest',
    description: 'Interest-based targeting',
    icon: '🎯'
  },
  custom: {
    label: 'Custom',
    description: 'Custom or lookalike audiences',
    icon: '👥'
  },
}
