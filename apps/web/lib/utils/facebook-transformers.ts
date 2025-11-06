import type {
  CampaignConfig,
  BulkAudiencesConfig,
  BulkCreativesConfig,
  AudiencePreset,
  Creative,
  PlacementPreset,
} from '@launcher-ads/sdk'
import type { FacebookCampaign, FacebookAdSet, FacebookAd } from '../store/bulk-launcher'

/**
 * Transform Facebook campaign data to Launcher format
 * Used when entering Edit Mode to pre-fill the launcher
 */
export function transformFacebookToLauncher(data: {
  campaign: FacebookCampaign
  adSets: FacebookAdSet[]
  ads: Record<string, FacebookAd[]>
}): {
  campaign: Partial<CampaignConfig>
  bulkAudiences: Partial<BulkAudiencesConfig>
  bulkCreatives: Partial<BulkCreativesConfig>
} {
  const { campaign, adSets, ads } = data

  // Transform campaign
  const transformedCampaign: Partial<CampaignConfig> = {
    name: campaign.name,
    type: mapFacebookObjectiveToCampaignType(campaign.objective),
    objective: campaign.objective,
    budgetMode: campaign.daily_budget ? 'CBO' : 'ABO',
    budgetType: campaign.daily_budget ? 'daily' : 'lifetime',
    budget: campaign.daily_budget || campaign.lifetime_budget || 0,
    startDate: campaign.start_time
      ? new Date(campaign.start_time).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }

  // Transform ad sets to audiences
  const transformedAudiences = transformAdSetsToAudiences(adSets)

  // Transform ads to creatives
  const transformedCreatives = transformAdsToCreatives(ads)

  // Extract common targeting from first ad set
  const firstAdSet = adSets[0]
  const geoLocations = firstAdSet?.targeting?.geo_locations || {}
  const demographics = firstAdSet?.targeting || {}

  const bulkAudiences: Partial<BulkAudiencesConfig> = {
    audiences: transformedAudiences.audiences,
    placementPresets: transformedAudiences.placementPresets,
    geoLocations: {
      countries: geoLocations.countries || [],
      regions: (geoLocations.regions || []).map((r: any) => ({
        key: r.key,
        name: r.name,
      })),
      cities: (geoLocations.cities || []).map((c: any) => ({
        key: c.key,
        name: c.name,
        region: c.region,
        country: c.country_code,
      })),
    },
    demographics: {
      ageMin: demographics.age_min || 18,
      ageMax: demographics.age_max || 65,
      gender: mapFacebookGender(demographics.genders),
      languages: demographics.locales || [],
    },
    optimizationEvent: firstAdSet?.optimization_goal || 'LINK_CLICK',
    budgetPerAdSet: firstAdSet?.daily_budget || firstAdSet?.lifetime_budget || 50,
    budgetType: firstAdSet?.daily_budget ? 'daily' : 'lifetime',
  }

  const bulkCreatives: Partial<BulkCreativesConfig> = {
    creatives: transformedCreatives,
    sameCopyForAll: true,
    globalHeadline: '',
    globalPrimaryText: '',
    globalCTA: 'Learn More',
    creativeCopies: {},
    enableVariants: false,
    copyVariants: [],
  }

  return {
    campaign: transformedCampaign,
    bulkAudiences,
    bulkCreatives,
  }
}

/**
 * Transform Facebook ad sets to audience presets
 */
function transformAdSetsToAudiences(adSets: FacebookAdSet[]): {
  audiences: AudiencePreset[]
  placementPresets: PlacementPreset[]
} {
  const audiences: AudiencePreset[] = []
  const placementPresetsSet = new Set<PlacementPreset>()

  for (const adSet of adSets) {
    const targeting = adSet.targeting || {}

    // Extract interests
    const interests = targeting.flexible_spec?.[0]?.interests || []
    if (interests.length > 0) {
      audiences.push({
        id: `interest-${adSet.id}`,
        name: `Interests from ${adSet.name}`,
        type: 'interests',
        interests: interests.map((i: any) => ({
          id: i.id,
          name: i.name,
        })),
      })
    }

    // Check if broad targeting
    const isBroad =
      !interests.length &&
      !targeting.custom_audiences?.length &&
      !targeting.excluded_custom_audiences?.length

    if (isBroad) {
      audiences.push({
        id: `broad-${adSet.id}`,
        name: `Broad from ${adSet.name}`,
        type: 'broad',
      })
    }

    // Extract placement info (simplified - would need more logic for real implementation)
    placementPresetsSet.add('ALL_PLACEMENTS')
  }

  return {
    audiences: audiences.length > 0 ? audiences : [],
    placementPresets: Array.from(placementPresetsSet),
  }
}

/**
 * Transform Facebook ads to creatives
 */
function transformAdsToCreatives(ads: Record<string, FacebookAd[]>): Creative[] {
  const creatives: Creative[] = []
  const seenCreativeIds = new Set<string>()

  // Flatten all ads from all ad sets
  const allAds = Object.values(ads).flat()

  for (const ad of allAds) {
    const creative = ad.creative
    if (!creative || seenCreativeIds.has(creative.id)) continue

    seenCreativeIds.add(creative.id)

    // Determine format based on creative data
    let format: 'Image' | 'Video' = 'Image'
    if (creative.video_id || creative.object_story_spec?.video_data) {
      format = 'Video'
    }

    // Extract copy from object_story_spec
    const objectStorySpec = creative.object_story_spec || {}
    const linkData = objectStorySpec.link_data || {}

    creatives.push({
      id: creative.id,
      name: creative.name || `Creative ${creative.id}`,
      format,
      label: 'Static',
      // Store reference to existing creative
      existingCreativeId: creative.id,
      // Extract copy if available
      headline: linkData.name || undefined,
      primaryText: linkData.message || undefined,
      description: linkData.description || undefined,
      cta: linkData.call_to_action?.type || undefined,
    })
  }

  return creatives
}

/**
 * Map Facebook objective to Launcher campaign type
 */
function mapFacebookObjectiveToCampaignType(
  objective: string,
): 'Awareness' | 'Traffic' | 'Engagement' | 'Leads' | 'AppPromotion' | 'Sales' {
  const mapping: Record<string, CampaignConfig['type']> = {
    OUTCOME_TRAFFIC: 'Traffic',
    OUTCOME_ENGAGEMENT: 'Engagement',
    OUTCOME_LEADS: 'Leads',
    OUTCOME_APP_PROMOTION: 'AppPromotion',
    OUTCOME_SALES: 'Sales',
    OUTCOME_AWARENESS: 'Awareness',
    // Legacy objectives
    LINK_CLICKS: 'Traffic',
    POST_ENGAGEMENT: 'Engagement',
    LEAD_GENERATION: 'Leads',
    APP_INSTALLS: 'AppPromotion',
    CONVERSIONS: 'Sales',
    BRAND_AWARENESS: 'Awareness',
  }

  return mapping[objective] || 'Traffic'
}

/**
 * Map Facebook gender targeting to Launcher format
 */
function mapFacebookGender(genders: number[] | undefined): 'All' | 'Male' | 'Female' {
  if (!genders || genders.length === 0 || genders.length === 2) {
    return 'All'
  }
  if (genders.includes(1)) {
    return 'Male'
  }
  if (genders.includes(2)) {
    return 'Female'
  }
  return 'All'
}

/**
 * Transform Launcher data back to Facebook format for updates
 * Used when submitting edits to merge with existing campaign
 */
export function transformLauncherToFacebook(
  launcherData: {
    campaign: Partial<CampaignConfig>
    bulkAudiences: BulkAudiencesConfig
    bulkCreatives: BulkCreativesConfig
  },
  editContext: {
    campaignId: string
    existingAdSets?: FacebookAdSet[]
  },
): {
  campaignUpdates: Partial<FacebookCampaign>
  newAdSets: Partial<FacebookAdSet>[]
  newAds: Partial<FacebookAd>[]
} {
  // Transform campaign updates
  const campaignUpdates: Partial<FacebookCampaign> = {}
  if (launcherData.campaign.name) {
    campaignUpdates.name = launcherData.campaign.name
  }
  if (launcherData.campaign.budget) {
    if (launcherData.campaign.budgetType === 'daily') {
      campaignUpdates.daily_budget = launcherData.campaign.budget
    } else {
      campaignUpdates.lifetime_budget = launcherData.campaign.budget
    }
  }

  // Note: newAdSets and newAds would be generated by the matrix logic
  // This is a simplified placeholder
  const newAdSets: Partial<FacebookAdSet>[] = []
  const newAds: Partial<FacebookAd>[] = []

  return {
    campaignUpdates,
    newAdSets,
    newAds,
  }
}
