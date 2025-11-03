/**
 * Workflow Types - 3-column visual strategy builder
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

export type GoogleCampaignType =
  | 'PMAX'  // Performance Max
  | 'SEARCH'  // Search campaigns

export type CampaignObjective = MetaObjective | GoogleCampaignType

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
  objective: CampaignObjective  // Can be Meta objective or Google campaign type
  dimensions: NodeDimension[]
  multiplier: number  // Ex: "2 campaigns" même sans dimensions
  audiences: AudienceConfig[]  // Audience configuration
  onDelete?: (nodeId: string) => void  // Callback for node deletion
}
