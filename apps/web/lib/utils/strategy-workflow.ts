import type { MetaObjective, FunnelStage } from '@/lib/types/strategy-workflow'

/**
 * Maps Meta objectives to funnel stages for automatic column placement
 */
export function getStageFromObjective(objective: MetaObjective): FunnelStage {
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
