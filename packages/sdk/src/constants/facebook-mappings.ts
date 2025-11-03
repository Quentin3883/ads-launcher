/**
 * Facebook API Mappings (Shared between frontend and backend)
 * Centralized constants for mapping between our app and Facebook's API
 */

/**
 * Call-to-Action mappings
 * Maps user-friendly CTA labels to Facebook API CTA types
 */
export const FACEBOOK_CTA_MAP: Record<string, string> = {
  'Learn More': 'LEARN_MORE',
  'Shop Now': 'SHOP_NOW',
  'Sign Up': 'SIGN_UP',
  'Download': 'DOWNLOAD',
  'Watch More': 'WATCH_MORE',
  'Contact Us': 'CONTACT_US',
  'Book Now': 'BOOK_NOW',
  'Get Quote': 'GET_QUOTE',
  'Apply Now': 'APPLY_NOW',
  'Subscribe': 'SUBSCRIBE',
  'See Menu': 'SEE_MENU',
  'Get Offer': 'GET_OFFER',
} as const

/**
 * Campaign Type to Facebook Objective mappings
 * Maps our simplified campaign types to Facebook's outcome objectives
 */
export const CAMPAIGN_TYPE_TO_OBJECTIVE: Record<string, string> = {
  Awareness: 'OUTCOME_AWARENESS',
  Traffic: 'OUTCOME_TRAFFIC',
  Engagement: 'OUTCOME_ENGAGEMENT',
  Leads: 'OUTCOME_LEADS',
  AppPromotion: 'OUTCOME_APP_PROMOTION',
  Sales: 'OUTCOME_SALES',
} as const

/**
 * Optimization Goal mappings
 * Maps Facebook objectives to their default optimization goals
 */
export const OPTIMIZATION_GOAL_MAP: Record<string, string> = {
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_ENGAGEMENT: 'POST_ENGAGEMENT',
  OUTCOME_LEADS: 'LEAD_GENERATION',
  OUTCOME_SALES: 'OFFSITE_CONVERSIONS',
  OUTCOME_APP_PROMOTION: 'APP_INSTALLS',
} as const
