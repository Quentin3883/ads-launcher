import { z } from 'zod'

// ============================================
// BULK LAUNCHER TYPES
// ============================================

export type CampaignType = 'Awareness' | 'Traffic' | 'Engagement' | 'Leads' | 'AppPromotion' | 'Sales'
export type RedirectionType = 'LANDING_PAGE' | 'LEAD_FORM' | 'DEEPLINK'
export type BudgetMode = 'CBO' | 'ABO'
export type BudgetType = 'daily' | 'lifetime'

// Audience presets
export type AudiencePresetType = 'BROAD' | 'INTEREST' | 'LOOKALIKE' | 'CUSTOM_AUDIENCE'

export interface AudiencePreset {
  id: string
  type: AudiencePresetType
  name: string
  // For interests
  interests?: string[]
  // For lookalike
  lookalikeSource?: string
  lookalikePercentages?: number[] // [1, 2, 5]
  // For custom audience
  customAudienceId?: string
}

// Placement presets
export type PlacementPreset = 'FEEDS_REELS' | 'STORIES_ONLY' | 'ALL_PLACEMENTS' | 'CUSTOM'

export interface PlacementPresetConfig {
  preset: PlacementPreset
  placements: string[]
}

export const PLACEMENT_PRESETS: Record<PlacementPreset, string[]> = {
  FEEDS_REELS: ['Feed', 'Reels'],
  STORIES_ONLY: ['Stories'],
  ALL_PLACEMENTS: ['Feed', 'Stories', 'Reels', 'Explore', 'Messenger', 'Search', 'In-stream'],
  CUSTOM: [],
}

// Creative with metadata
export interface CreativeVersion {
  file?: File
  url: string
  thumbnail?: string
}

export interface Creative {
  id: string
  name: string
  format: 'Image' | 'Video' | 'Carousel'
  feedVersion?: CreativeVersion // Version Feed
  storyVersion?: CreativeVersion // Version Story
}

// Copy variant
export interface CopyVariant {
  id: string
  name: string // VP-A, VP-B, VP-C
  headline: string
  primaryText: string
  cta: string
}

// Geo locations
export interface GeoLocations {
  countries: string[]
  regions?: string[]
  cities?: string[]
}

// Demographics
export interface Demographics {
  ageMin: number
  ageMax: number
  gender: 'All' | 'Male' | 'Female'
  languages?: string[]
}

// Format variants (Feed/Story per creative)
export type FormatVariant = 'Feed' | 'Story'

// Matrix dimensions (checkboxes)
export interface MatrixDimensions {
  audiences: boolean
  placements: boolean
  creatives: boolean
  formatVariants: boolean // NEW: Generate Feed + Story versions
  copyVariants: boolean
}

// Campaign config (Step 1 - unchanged)
export const campaignConfigSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  type: z.enum(['Awareness', 'Traffic', 'Engagement', 'Leads', 'AppPromotion', 'Sales']),
  objective: z.string().optional(),
  country: z.string().optional(),

  // Redirection
  redirectionType: z.enum(['LANDING_PAGE', 'LEAD_FORM', 'DEEPLINK']),
  redirectionUrl: z.string().optional(),
  redirectionFormId: z.string().optional(),
  redirectionDeeplink: z.string().optional(),

  // Budget
  budgetMode: z.enum(['CBO', 'ABO']),
  budgetType: z.enum(['daily', 'lifetime']),
  budget: z.number().optional(), // Only if CBO

  // Schedule
  startDate: z.string(),
  endDate: z.string().optional(),

  // URL Params
  urlParamsOverride: z.string().optional(),
})

export type CampaignConfig = z.infer<typeof campaignConfigSchema>

// Bulk Audiences config (Step 2)
export interface BulkAudiencesConfig {
  audiences: AudiencePreset[]
  placementPresets: PlacementPreset[]
  customPlacements?: string[]
  geoLocations: GeoLocations
  demographics: Demographics
  optimizationEvent: string
  budgetPerAdSet?: number // Only if ABO
  budgetType?: BudgetType // Only if ABO
}

// Bulk Creatives config (Step 3)
export interface BulkCreativesConfig {
  creatives: Creative[]
  sameCopyForAll: boolean
  // If sameCopyForAll = true
  globalHeadline?: string
  globalPrimaryText?: string
  globalCTA?: string
  // If sameCopyForAll = false
  creativeCopies?: Record<string, { headline: string; primaryText: string; cta: string }>
  // Copy variants (optional)
  enableVariants: boolean
  copyVariants?: CopyVariant[]
}

// Matrix config (Step 4)
export interface MatrixConfig {
  dimensions: MatrixDimensions
  softLimit: number
}

// Generated Ad Set (output)
export interface GeneratedAdSet {
  id: string
  name: string
  audience: AudiencePreset
  placementPreset: PlacementPreset
  placements: string[]
  geoLocations: GeoLocations
  demographics: Demographics
  optimizationEvent: string
  budget?: number
  budgetType?: BudgetType
  ads: GeneratedAd[]
}

// Generated Ad (output)
export interface GeneratedAd {
  id: string
  adSetId: string
  name: string
  format: 'Image' | 'Video' | 'Carousel'
  creativeUrl: string
  headline: string
  primaryText: string
  cta: string
  destination: {
    type: RedirectionType
    url?: string
    formId?: string
    deeplink?: string
  }
  finalUrlWithParams: string
}

// Full campaign output
export interface BulkCampaignOutput {
  campaign: CampaignConfig
  adSets: GeneratedAdSet[]
  stats: {
    adSets: number
    adsPerAdSet: number
    totalAds: number
  }
}

// ============================================
// CONSTANTS
// ============================================

export const COUNTRIES = [
  'United States',
  'France',
  'Canada',
  'United Kingdom',
  'Germany',
  'Spain',
  'Italy',
  'Australia',
  'Brazil',
  'Mexico',
]

export const REGIONS: Record<string, string[]> = {
  'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine'],
  'United States': ['California', 'New York', 'Texas', 'Florida'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
}

export const CITIES: Record<string, string[]> = {
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary'],
}

export const INTERESTS_OPTIONS = [
  'Shopping',
  'Fashion',
  'Technology',
  'Travel',
  'Food & Dining',
  'Fitness',
  'Business',
  'Real Estate',
  'Education',
  'Entertainment',
  'Sports',
  'Gaming',
]

export const CTA_OPTIONS = [
  'Learn More',
  'Shop Now',
  'Sign Up',
  'Get Quote',
  'Download',
  'Book Now',
  'Contact Us',
  'Apply Now',
  'Install Now',
  'Watch More',
]

export const LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Chinese',
  'Japanese',
  'Korean',
]

export const OPTIMIZATION_EVENTS = [
  'LEAD',
  'LINK_CLICK',
  'LANDING_PAGE_VIEW',
  'PURCHASE',
  'APP_INSTALL',
  'ENGAGEMENT',
]

// ============================================
// HELPERS
// ============================================

export function generateId(): string {
  return Math.random().toString(36).substring(7)
}

export function getDefaultRedirectionType(campaignType: CampaignType): RedirectionType {
  switch (campaignType) {
    case 'Leads':
      return 'LEAD_FORM'
    case 'AppPromotion':
      return 'DEEPLINK'
    default:
      return 'LANDING_PAGE'
  }
}

export function getAllowedRedirectionTypes(campaignType: CampaignType): RedirectionType[] {
  switch (campaignType) {
    case 'Leads':
      return ['LEAD_FORM', 'LANDING_PAGE']
    case 'AppPromotion':
      return ['DEEPLINK', 'LANDING_PAGE']
    default:
      return ['LANDING_PAGE']
  }
}

export function generateUrlParams(campaign: Partial<CampaignConfig>, adSetName?: string, _adName?: string): string {
  return `visual={{ad.name}}&site_source_name={{site_source_name}}&placement={{placement}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}&utm_source=facebook&utm_medium=paid_social&utm_campaign=${campaign.name || '{{campaign.name}}'}&utm_content=${adSetName || '{{adset.name}}'}`
}

// Calculate matrix expansion
export function calculateMatrixStats(
  audiences: AudiencePreset[],
  placementPresets: PlacementPreset[],
  creatives: Creative[],
  enableVariants: boolean,
  copyVariants: CopyVariant[],
  dimensions: MatrixDimensions
): { adSets: number; adsPerAdSet: number; totalAds: number } {
  const counts = {
    audiences: dimensions.audiences ? audiences.length : 1,
    placements: dimensions.placements ? placementPresets.length : 1,
    creatives: dimensions.creatives ? creatives.length : 1,
    formatVariants: dimensions.formatVariants ? 2 : 1, // Feed + Story
    copyVariants: dimensions.copyVariants && enableVariants ? copyVariants.length : 1,
  }

  const adSets = counts.audiences * counts.placements
  const adsPerAdSet = counts.creatives * counts.formatVariants * counts.copyVariants

  return { adSets, adsPerAdSet, totalAds: adSets * adsPerAdSet }
}

// Generate Ad Sets from matrix
export function generateAdSetsFromMatrix(
  campaign: CampaignConfig,
  bulkAudiences: BulkAudiencesConfig,
  bulkCreatives: BulkCreativesConfig,
  dimensions: MatrixDimensions
): GeneratedAdSet[] {
  // Get dimension values (single item if dimension is off)
  const audiences = dimensions.audiences
    ? bulkAudiences.audiences
    : [bulkAudiences.audiences[0] || createDefaultAudience()]

  const placementPresets = dimensions.placements
    ? bulkAudiences.placementPresets
    : [bulkAudiences.placementPresets[0] || 'ALL_PLACEMENTS']

  // Generate matrix: audiences × placements
  return audiences.flatMap((audience) =>
    placementPresets.map((preset) => {
      const adSetId = generateId()
      const ads = generateAdsForAdSet(adSetId, audience, preset, campaign, bulkCreatives, dimensions)
      const country = bulkAudiences.geoLocations.countries[0] || 'Global'

      return {
        id: adSetId,
        name: `${audience.name} | ${preset} | ${country}`,
        audience,
        placementPreset: preset,
        placements: PLACEMENT_PRESETS[preset] || [],
        geoLocations: bulkAudiences.geoLocations,
        demographics: bulkAudiences.demographics,
        optimizationEvent: bulkAudiences.optimizationEvent,
        budget: campaign.budgetMode === 'ABO' ? bulkAudiences.budgetPerAdSet : undefined,
        budgetType: campaign.budgetMode === 'ABO' ? bulkAudiences.budgetType : undefined,
        ads,
      }
    })
  )
}

function generateAdsForAdSet(
  adSetId: string,
  _audience: AudiencePreset,
  _placementPreset: PlacementPreset,
  campaign: CampaignConfig,
  bulkCreatives: BulkCreativesConfig,
  dimensions: MatrixDimensions
): GeneratedAd[] {
  // Get dimension values
  const creatives = dimensions.creatives
    ? bulkCreatives.creatives
    : bulkCreatives.creatives[0]
    ? [bulkCreatives.creatives[0]]
    : []

  const formatVariants: FormatVariant[] = dimensions.formatVariants ? ['Feed', 'Story'] : ['Feed']
  const copyVariants: (CopyVariant | null)[] = dimensions.copyVariants && bulkCreatives.enableVariants
    ? bulkCreatives.copyVariants || []
    : [null] // null = no variant

  // Generate matrix: creatives × formatVariants × copyVariants
  return creatives.flatMap((creative) =>
    formatVariants.flatMap((formatVariant) =>
      copyVariants.map((copyVariant) =>
        createAd(adSetId, creative, formatVariant, copyVariant, campaign, bulkCreatives)
      )
    )
  )
}

function createAd(
  adSetId: string,
  creative: Creative,
  formatVariant: FormatVariant,
  copyVariant: CopyVariant | null,
  campaign: CampaignConfig,
  bulkCreatives: BulkCreativesConfig
): GeneratedAd {
  // Build ad name
  const adName = [creative.name, formatVariant, copyVariant?.name].filter(Boolean).join(' | ')

  // Select creative version based on format
  const creativeVersion = formatVariant === 'Feed' ? creative.feedVersion : creative.storyVersion

  // Resolve copy (priority: variant > creative-specific > global)
  const copy = getCopy(creative, copyVariant, bulkCreatives)

  // Build destination URL
  const destination = getDestination(campaign)
  const finalUrlWithParams = getFinalUrl(campaign, destination, adName)

  return {
    id: generateId(),
    adSetId,
    name: adName,
    format: creative.format,
    creativeUrl: creativeVersion?.url || '',
    ...copy,
    destination,
    finalUrlWithParams,
  }
}

function getCopy(
  creative: Creative,
  copyVariant: CopyVariant | null,
  bulkCreatives: BulkCreativesConfig
) {
  // Priority 1: Copy variant overrides everything
  if (copyVariant) {
    return {
      headline: copyVariant.headline,
      primaryText: copyVariant.primaryText,
      cta: copyVariant.cta,
    }
  }

  // Priority 2: Global copy if "same for all" is enabled
  if (bulkCreatives.sameCopyForAll) {
    return {
      headline: bulkCreatives.globalHeadline || '',
      primaryText: bulkCreatives.globalPrimaryText || '',
      cta: bulkCreatives.globalCTA || 'Learn More',
    }
  }

  // Priority 3: Creative-specific copy
  const creativeCopy = bulkCreatives.creativeCopies?.[creative.id]
  return {
    headline: creativeCopy?.headline || '',
    primaryText: creativeCopy?.primaryText || '',
    cta: creativeCopy?.cta || 'Learn More',
  }
}

function getDestination(campaign: CampaignConfig) {
  return {
    type: campaign.redirectionType,
    url: campaign.redirectionUrl,
    formId: campaign.redirectionFormId,
    deeplink: campaign.redirectionDeeplink,
  }
}

function getFinalUrl(campaign: CampaignConfig, destination: ReturnType<typeof getDestination>, adName: string): string {
  // Lead forms don't have URLs
  if (destination.type === 'LEAD_FORM') {
    return `Form ID: ${destination.formId || 'Not set'}`
  }

  // Get base URL based on redirection type
  const baseUrl = destination.type === 'LANDING_PAGE' ? destination.url : destination.deeplink
  if (!baseUrl) return 'Not set'

  // Append URL parameters
  const params = campaign.urlParamsOverride || generateUrlParams(campaign, '', adName)
  return `${baseUrl}?${params}`
}

function createDefaultAudience(): AudiencePreset {
  return {
    id: generateId(),
    type: 'BROAD',
    name: 'Broad',
  }
}
