import { z } from 'zod'

// ============================================
// ENUMS & BASIC TYPES
// ============================================

export const campaignTypeSchema = z.enum(['Awareness', 'Traffic', 'Engagement', 'Leads', 'AppPromotion', 'Sales'])
export const redirectionTypeSchema = z.enum(['LANDING_PAGE', 'LEAD_FORM', 'DEEPLINK'])
export const budgetModeSchema = z.enum(['CBO', 'ABO'])
export const budgetTypeSchema = z.enum(['daily', 'lifetime'])
export const audiencePresetTypeSchema = z.enum(['BROAD', 'INTEREST', 'LOOKALIKE', 'CUSTOM_AUDIENCE'])
export const placementPresetSchema = z.enum([
  'FEEDS_REELS',
  'STORIES_ONLY',
  'ALL_PLACEMENTS',
  'CUSTOM',
  'FACEBOOK_ONLY',
  'INSTAGRAM_ONLY',
  'FEED_ONLY',
  'REELS_ONLY',
])
export const creativeFormatSchema = z.enum(['Image', 'Video', 'Carousel'])
export const formatVariantSchema = z.enum(['Feed', 'Story'])
export const creativeLabelSchema = z.enum(['Static', 'Video', 'UGC', 'Other'])
export const genderSchema = z.enum(['All', 'Male', 'Female'])

// TypeScript types from Zod schemas
export type CampaignType = z.infer<typeof campaignTypeSchema>
export type RedirectionType = z.infer<typeof redirectionTypeSchema>
export type BudgetMode = z.infer<typeof budgetModeSchema>
export type BudgetType = z.infer<typeof budgetTypeSchema>
export type AudiencePresetType = z.infer<typeof audiencePresetTypeSchema>
export type PlacementPreset = z.infer<typeof placementPresetSchema>
export type CreativeFormat = z.infer<typeof creativeFormatSchema>
export type FormatVariant = z.infer<typeof formatVariantSchema>
export type CreativeLabel = z.infer<typeof creativeLabelSchema>
export type Gender = z.infer<typeof genderSchema>

// ============================================
// AUDIENCE SCHEMAS
// ============================================

export const audiencePresetSchema = z.object({
  id: z.string(),
  type: audiencePresetTypeSchema,
  name: z.string(),
  interests: z.array(z.string()).optional(),
  lookalikeSource: z.string().optional(),
  lookalikePercentages: z.array(z.number()).optional(),
  customAudienceId: z.string().optional(),
})

export type AudiencePreset = z.infer<typeof audiencePresetSchema>

// ============================================
// GEO & DEMOGRAPHICS SCHEMAS
// ============================================

export const geoLocationsSchema = z.object({
  countries: z.array(z.string()),
  regions: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
})

export const demographicsSchema = z.object({
  ageMin: z.number().int().min(13).max(65),
  ageMax: z.number().int().min(13).max(65),
  gender: genderSchema,
  languages: z.array(z.string()).optional(),
})

export type GeoLocations = z.infer<typeof geoLocationsSchema>
export type Demographics = z.infer<typeof demographicsSchema>

// ============================================
// CREATIVE SCHEMAS
// ============================================

export const creativeVersionSchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  file: z.any().optional(), // File object for uploads (not validated by Zod)
})

export const creativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: creativeFormatSchema,
  label: creativeLabelSchema.default('Static'),
  feedVersion: creativeVersionSchema.optional(),
  storyVersion: creativeVersionSchema.optional(),
  // Optional per-creative copy (overrides copy variants if provided)
  headline: z.string().max(255).optional(),
  primaryText: z.string().max(2000).optional(),
  description: z.string().max(255).optional(),
  cta: z.string().max(50).optional(),
  // Reference to existing Facebook creative (for Edit Mode / duplication)
  existingCreativeId: z.string().optional(),
})

export const copyVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().min(1).max(255),
  primaryText: z.string().min(1).max(2000),
  cta: z.string().min(1).max(50),
})

export type CreativeVersion = z.infer<typeof creativeVersionSchema>
export type Creative = z.infer<typeof creativeSchema>
export type CopyVariant = z.infer<typeof copyVariantSchema>

// ============================================
// CAMPAIGN CONFIG SCHEMA (Step 1)
// ============================================

export const campaignConfigSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  type: campaignTypeSchema,
  objective: z.string().optional(),
  country: z.string().optional(),
  redirectionType: redirectionTypeSchema,
  redirectionUrl: z.string().url().optional(),
  redirectionFormId: z.string().optional(),
  redirectionDeeplink: z.string().optional(),
  budgetMode: budgetModeSchema,
  budgetType: budgetTypeSchema,
  budget: z.number().positive().optional(),
  startDate: z.string(), // 'NOW' or ISO date (YYYY-MM-DD)
  startTime: z.string().optional(), // HH:MM format (only used when startDate is not 'NOW')
  endDate: z.string().optional(),
  endTime: z.string().optional(), // HH:MM format (only used when endDate is set)
  urlParamsOverride: z.string().optional(),

  // Facebook API v24 Advanced Fields
  optimizationGoal: z.string().optional(), // Ex: 'LINK_CLICKS', 'REACH', 'OFFSITE_CONVERSIONS'
  billingEvent: z.string().optional(), // Ex: 'IMPRESSIONS', 'LINK_CLICKS'
  bidStrategy: z.string().optional(), // Ex: 'LOWEST_COST_WITHOUT_CAP'
  buyingType: z.string().optional(), // 'AUCTION' (default) ou 'RESERVED'
  destinationType: z.string().optional(), // 'WEBSITE', 'APP', 'MESSENGER', etc.

  // Promoted Object (conversions, pixel, app)
  pixelId: z.string().optional(), // Pour conversions off-Facebook
  customEventType: z.string().optional(), // Ex: 'PURCHASE', 'LEAD', 'ADD_TO_CART'
  applicationId: z.string().optional(), // Pour app promotion
  objectStoreUrl: z.string().optional(), // URL App Store / Play Store
  productCatalogId: z.string().optional(), // Pour dynamic ads
  productSetId: z.string().optional(), // Pour dynamic ads

  // Special Ad Categories
  specialAdCategories: z.array(z.string()).optional(), // ['HOUSING'], ['CREDIT'], etc.
  specialAdCategoryCountry: z.array(z.string()).optional(), // ['FR'], ['US'], etc.
})

export type CampaignConfig = z.infer<typeof campaignConfigSchema>

// ============================================
// BULK AUDIENCES CONFIG SCHEMA (Step 2)
// ============================================

export const bulkAudiencesConfigSchema = z.object({
  audiences: z.array(audiencePresetSchema),
  placementPresets: z.array(placementPresetSchema),
  customPlacements: z.array(z.string()).optional(),
  geoLocations: geoLocationsSchema,
  demographics: demographicsSchema,
  optimizationEvent: z.string(),
  budgetPerAdSet: z.number().positive().optional(),
  budgetType: budgetTypeSchema.optional(),
})

export type BulkAudiencesConfig = z.infer<typeof bulkAudiencesConfigSchema>

// ============================================
// BULK CREATIVES CONFIG SCHEMA (Step 3)
// ============================================

export const bulkCreativesConfigSchema = z.object({
  creatives: z.array(creativeSchema),
  sameCopyForAll: z.boolean(),
  globalHeadline: z.string().optional(),
  globalPrimaryText: z.string().optional(),
  globalCTA: z.string().optional(),
  creativeCopies: z.record(
    z.object({
      headline: z.string(),
      primaryText: z.string(),
      cta: z.string(),
    })
  ).optional(),
  enableVariants: z.boolean(),
  copyVariants: z.array(copyVariantSchema).optional(),
})

export type BulkCreativesConfig = z.infer<typeof bulkCreativesConfigSchema>

// ============================================
// MATRIX CONFIG SCHEMA (Step 4)
// ============================================

export const matrixDimensionsSchema = z.object({
  audiences: z.boolean(),
  placements: z.boolean(),
  creatives: z.boolean(),
  formatVariants: z.boolean(), // Feed + Story variants (asset customization)
  formatSplit: z.boolean(), // Split by Image vs Video
  copyVariants: z.boolean(),
})

export const matrixConfigSchema = z.object({
  dimensions: matrixDimensionsSchema,
  softLimit: z.number().int().positive(),
})

export type MatrixDimensions = z.infer<typeof matrixDimensionsSchema>
export type MatrixConfig = z.infer<typeof matrixConfigSchema>

// ============================================
// GENERATED OUTPUT SCHEMAS
// ============================================

export const generatedAdSchema = z.object({
  id: z.string(),
  adSetId: z.string(),
  name: z.string(),
  format: creativeFormatSchema,
  label: creativeLabelSchema.optional(),
  creativeUrl: z.string().url(),
  creativeUrlStory: z.string().url().optional(), // Story format URL for asset customization
  headline: z.string(),
  primaryText: z.string(),
  cta: z.string(),
  destination: z.object({
    type: redirectionTypeSchema,
    url: z.string().url().optional(),
    formId: z.string().optional(),
    deeplink: z.string().optional(),
  }),
  finalUrlWithParams: z.string().url(),
})

export const generatedAdSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: audiencePresetSchema,
  placementPreset: placementPresetSchema,
  placements: z.array(z.string()),
  geoLocations: geoLocationsSchema,
  demographics: demographicsSchema,
  optimizationEvent: z.string(),
  budget: z.number().positive().optional(),
  budgetType: budgetTypeSchema.optional(),
  ads: z.array(generatedAdSchema),
})

export const bulkCampaignOutputSchema = z.object({
  campaign: campaignConfigSchema,
  adSets: z.array(generatedAdSetSchema),
  stats: z.object({
    adSets: z.number().int(),
    adsPerAdSet: z.number().int(),
    totalAds: z.number().int(),
  }),
})

export type GeneratedAd = z.infer<typeof generatedAdSchema>
export type GeneratedAdSet = z.infer<typeof generatedAdSetSchema>
export type BulkCampaignOutput = z.infer<typeof bulkCampaignOutputSchema>

// ============================================
// CONSTANTS
// ============================================

export const PLACEMENT_PRESETS: Record<PlacementPreset, string[]> = {
  FEEDS_REELS: ['Feed', 'Reels'],
  STORIES_ONLY: ['Stories'],
  ALL_PLACEMENTS: ['Feed', 'Stories', 'Reels', 'Explore', 'Messenger', 'Search', 'In-stream'],
  CUSTOM: [],
  FACEBOOK_ONLY: ['Facebook Feed', 'Facebook Stories', 'Facebook Reels', 'Facebook Marketplace'],
  INSTAGRAM_ONLY: ['Instagram Feed', 'Instagram Stories', 'Instagram Reels', 'Instagram Explore'],
  FEED_ONLY: ['Facebook Feed', 'Instagram Feed'],
  REELS_ONLY: ['Facebook Reels', 'Instagram Reels'],
}

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
  'Subscribe',
  'Watch More',
]

export const LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
]

export const OPTIMIZATION_EVENTS = [
  'Link Clicks',
  'Landing Page Views',
  'Impressions',
  'Reach',
  'Conversions',
  'Leads',
  'Post Engagement',
  'Video Views',
  'ThruPlay',
]

// ============================================
// UTILITIES
// ============================================

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
