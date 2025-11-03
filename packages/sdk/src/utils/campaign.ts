import type { CampaignType, RedirectionType } from '../schemas/bulk-launcher.schema'

/**
 * Get the default redirection type based on campaign type
 * Maps campaign objectives to their most common redirection patterns
 */
export function getDefaultRedirectionType(campaignType: CampaignType): RedirectionType {
  switch (campaignType) {
    case 'Traffic':
      return 'LANDING_PAGE'

    case 'Leads':
      return 'LEAD_FORM'

    case 'AppPromotion':
      return 'DEEPLINK'

    case 'Awareness':
      return 'LANDING_PAGE'

    case 'Engagement':
      return 'LANDING_PAGE'

    case 'Sales':
      return 'LANDING_PAGE'

    default:
      return 'LANDING_PAGE'
  }
}
