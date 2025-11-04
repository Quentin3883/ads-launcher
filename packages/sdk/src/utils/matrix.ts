import type {
  CampaignConfig,
  BulkAudiencesConfig,
  BulkCreativesConfig,
  MatrixDimensions,
  GeneratedAdSet,
  GeneratedAd,
  AudiencePreset,
  PlacementPreset,
  Creative,
  CopyVariant,
} from '../schemas/bulk-launcher.schema'
import { PLACEMENT_PRESETS } from '../schemas/bulk-launcher.schema'
import { generateId } from '../schemas/bulk-launcher.schema'

/**
 * Generate ad sets from matrix configuration
 * Creates all combinations based on enabled dimensions
 */
export function generateAdSetsFromMatrix(
  campaign: CampaignConfig,
  audiences: BulkAudiencesConfig,
  creatives: BulkCreativesConfig,
  dimensions: MatrixDimensions
): GeneratedAdSet[] {
  const adSets: GeneratedAdSet[] = []

  // Audiences: ALWAYS use all audiences (dimension only affects naming/organization)
  if (!audiences.audiences || audiences.audiences.length === 0) return []

  // Placements: ALWAYS use all placements
  if (!audiences.placementPresets || audiences.placementPresets.length === 0) return []

  // Creatives: ALWAYS use all creatives
  if (!creatives.creatives || creatives.creatives.length === 0) return []

  // Get copy variants
  const activeCopyVariants = dimensions.copyVariants && creatives.enableVariants
    ? creatives.copyVariants || []
    : []

  // Split by format if enabled
  const formatSplits = dimensions.formatSplit
    ? ['Image', 'Video'] as const
    : [null]

  // If creatives dimension is enabled, create separate ad sets for each creative
  // Otherwise, put all creatives in the same ad set
  const creativesToIterate = dimensions.creatives ? creatives.creatives : [null]

  // Iterate through all combinations
  for (const audience of audiences.audiences) {
    if (!audience) continue

    for (const placementPreset of audiences.placementPresets) {
      if (!placementPreset) continue

      for (const formatFilter of formatSplits) {
        for (const creativeToSplit of creativesToIterate) {
          const adSetId = generateId()
          const placements = PLACEMENT_PRESETS[placementPreset] || []

          // Determine which creatives to use
          let creativesForAdSet: Creative[]
          if (dimensions.creatives && creativeToSplit) {
            // Dimension enabled: one creative per ad set
            creativesForAdSet = [creativeToSplit]
          } else {
            // Dimension disabled: all creatives in same ad set
            creativesForAdSet = creatives.creatives
          }

          // Filter by format if formatSplit is enabled
          if (formatFilter) {
            creativesForAdSet = creativesForAdSet.filter(c => c.format === formatFilter)
          }

          // Skip if no creatives for this format
          if (creativesForAdSet.length === 0) continue

          const ads: GeneratedAd[] = []

          // Generate ads for this ad set
          for (const creative of creativesForAdSet) {
            if (!creative) continue

            // Get both Feed and Story URLs if available
            const feedUrl = creative.feedVersion?.url || ''
            const storyUrl = creative.storyVersion?.url || ''

            // Must have at least one URL (Feed or Story)
            if (!feedUrl && !storyUrl) continue

            // Get copy for this creative
            const copy = creatives.sameCopyForAll
              ? {
                  headline: creatives.globalHeadline || '',
                  primaryText: creatives.globalPrimaryText || '',
                  cta: creatives.globalCTA || 'Learn More',
                }
              : creatives.creativeCopies?.[creative.id] || {
                  headline: '',
                  primaryText: '',
                  cta: 'Learn More',
                }

            // If copy variants enabled, create multiple ads
            if (activeCopyVariants.length > 0) {
              for (const variant of activeCopyVariants) {
                const ad = createAd(
                  adSetId,
                  creative,
                  feedUrl,
                  storyUrl,
                  variant,
                  campaign
                )
                ads.push(ad)
              }
            } else {
              // Single ad with both Feed and Story formats
              const ad = createAd(
                adSetId,
                creative,
                feedUrl,
                storyUrl,
                copy,
                campaign
              )
              ads.push(ad)
            }
          }

          // Skip empty ad sets
          if (ads.length === 0) continue

          // Create ad set
          const adSetName = formatFilter
            ? `${audience.name} - ${placementPreset} - ${formatFilter}`
            : `${audience.name} - ${placementPreset}`

          const adSet: GeneratedAdSet = {
            id: adSetId,
            name: adSetName,
            audience,
            placementPreset,
            placements,
            geoLocations: audiences.geoLocations,
            demographics: audiences.demographics,
            optimizationEvent: audiences.optimizationEvent,
            budget: audiences.budgetPerAdSet,
            budgetType: audiences.budgetType,
            ads,
          }

          adSets.push(adSet)
        }
      }
    }
  }

  return adSets
}

/**
 * Helper to create a single ad
 */
function createAd(
  adSetId: string,
  creative: Creative,
  feedUrl: string,
  storyUrl: string,
  copy: { headline: string; primaryText: string; cta: string },
  campaign: CampaignConfig
): GeneratedAd {
  const adId = generateId()

  // Build final URL with parameters
  const baseUrl = campaign.redirectionUrl || ''
  const params = campaign.urlParamsOverride || ''
  const finalUrl = params ? `${baseUrl}?${params}` : baseUrl

  return {
    id: adId,
    adSetId,
    name: `${creative.name} - ${copy.headline}`,
    format: creative.format,
    label: creative.label,
    creativeUrl: feedUrl || storyUrl, // Use Feed if available, otherwise Story
    creativeUrlStory: storyUrl || undefined,
    headline: copy.headline,
    primaryText: copy.primaryText,
    cta: copy.cta,
    destination: {
      type: campaign.redirectionType,
      url: campaign.redirectionType === 'LANDING_PAGE' ? campaign.redirectionUrl : undefined,
      formId: campaign.redirectionType === 'LEAD_FORM' ? campaign.redirectionFormId : undefined,
      deeplink: campaign.redirectionType === 'DEEPLINK' ? campaign.redirectionDeeplink : undefined,
    },
    finalUrlWithParams: finalUrl,
  }
}

/**
 * Calculate matrix statistics
 * Shows how many ad sets and ads will be generated
 */
export function calculateMatrixStats(
  audiences: AudiencePreset[],
  placements: PlacementPreset[],
  creatives: Creative[],
  enableVariants: boolean,
  copyVariants: CopyVariant[],
  dimensions: MatrixDimensions
): { adSets: number; adsPerAdSet: number; totalAds: number } {
  // ALWAYS use all audiences and placements (dimensions don't affect this)
  const audienceCount = audiences.length || 1
  const placementCount = placements.length || 1
  const formatSplitCount = dimensions.formatSplit ? 2 : 1 // Image + Video OR mixed
  const copyVariantCount = dimensions.copyVariants && enableVariants ? copyVariants.length : 1

  // Creatives dimension affects ad set count, not ad count
  // If dimension enabled: separate ad sets per creative
  // If dimension disabled: all creatives in same ad set
  const creativeAdSetMultiplier = dimensions.creatives ? creatives.length : 1

  // Ad sets = audiences × placements × format splits × creative splits
  const adSets = audienceCount * placementCount * formatSplitCount * creativeAdSetMultiplier

  // Number of creatives per ad set
  const creativesPerAdSet = dimensions.creatives ? 1 : creatives.length

  // Ads per ad set = creatives in ad set × copy variants
  // Note: formatVariants dimension is handled differently - it creates separate Feed/Story ads
  // but they're both included in a single ad creative, not separate ads
  const adsPerAdSet = creativesPerAdSet * copyVariantCount

  // Total ads
  const totalAds = adSets * adsPerAdSet

  return {
    adSets,
    adsPerAdSet,
    totalAds,
  }
}
