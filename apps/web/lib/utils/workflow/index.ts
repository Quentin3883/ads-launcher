import type { CampaignObjective, MetaObjective, GoogleCampaignType, FunnelStage } from '@/lib/types/workflow'

/**
 * Maps campaign objectives to funnel stages for automatic column placement
 */
export function getStageFromObjective(objective: CampaignObjective): FunnelStage {
  // Google campaigns
  if (objective === 'PMAX' || objective === 'SEARCH') {
    // Performance Max and Search can target all stages, default to conversion
    return 'conversion'
  }

  // Meta objectives
  switch (objective) {
    case 'AWARENESS':
      return 'awareness'
    case 'TRAFFIC':
    case 'ENGAGEMENT':
      return 'consideration'
    case 'LEADS':
    case 'APP_PROMOTION':
    case 'SALES':
      return 'conversion'
    default:
      return 'awareness'
  }
}

/**
 * Maps funnel stage to a default objective for that stage
 * Note: For Google, this returns Meta objectives. Platform-specific handling needed in UI.
 */
export function getDefaultObjectiveForStage(stage: FunnelStage): MetaObjective {
  switch (stage) {
    case 'awareness':
      return 'AWARENESS'
    case 'consideration':
      return 'TRAFFIC'
    case 'conversion':
      return 'LEADS'
  }
}
