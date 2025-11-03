import type {
  Platform,
  MetaObjective,
  GoogleCampaignType,
  FunnelStage,
  AudienceType,
} from '@/lib/types/workflow'

export const PLATFORM_CONFIG: Record<Platform, {
  label: string
  available: boolean
  launcherReady: boolean  // Available in launcher
  color: string
}> = {
  meta: { label: 'Meta Ads', available: true, launcherReady: true, color: '#0084FF' },
  google: { label: 'Google Ads', available: true, launcherReady: false, color: '#4285F4' },
  linkedin: { label: 'LinkedIn Ads', available: true, launcherReady: false, color: '#0A66C2' },
  tiktok: { label: 'TikTok Ads', available: true, launcherReady: false, color: '#000000' },
  snapchat: { label: 'Snapchat Ads', available: true, launcherReady: false, color: '#FFFC00' },
}

export const META_OBJECTIVES: Record<MetaObjective, { label: string }> = {
  AWARENESS: { label: 'Brand Awareness' },
  TRAFFIC: { label: 'Traffic' },
  ENGAGEMENT: { label: 'Engagement' },
  LEADS: { label: 'Lead Generation' },
  APP_PROMOTION: { label: 'App Promotion' },
  SALES: { label: 'Sales' },
}

export const GOOGLE_CAMPAIGN_TYPES: Record<GoogleCampaignType, { label: string }> = {
  PMAX: { label: 'Performance Max' },
  SEARCH: { label: 'Search' },
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
