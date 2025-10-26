import { z } from 'zod'

// Campaign validation schema
export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  country: z.string().min(1, 'Country is required'),
  objective: z.enum(['CONVERSIONS', 'TRAFFIC', 'BRAND_AWARENESS', 'LEAD_GENERATION', 'APP_INSTALLS']),
  budgetMode: z.enum(['CBO', 'ABO']),
  totalBudget: z.number().min(50, 'Minimum budget is $50').optional(),
})

// Audience validation schema
export const audiencePresetSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('BROAD'),
    name: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('INTEREST'),
    name: z.string(),
    interests: z.array(z.string()).min(1, 'At least one interest is required'),
  }),
  z.object({
    id: z.string(),
    type: z.literal('LOOKALIKE'),
    name: z.string(),
    lookalikeSource: z.string().min(1, 'LAL source is required'),
    lookalikePercentages: z.array(z.number()).min(1, 'At least one percentage is required'),
  }),
  z.object({
    id: z.string(),
    type: z.literal('CUSTOM_AUDIENCE'),
    name: z.string(),
    customAudienceId: z.string().min(1, 'Custom audience ID is required'),
  }),
])

export const bulkAudiencesSchema = z.object({
  audiences: z.array(audiencePresetSchema).min(1, 'At least one audience is required'),
  placementPresets: z
    .array(z.enum(['FEEDS_REELS', 'STORIES_ONLY', 'ALL_PLACEMENTS']))
    .min(1, 'At least one placement preset is required'),
  geoLocations: z.object({
    countries: z.array(z.string()).min(1, 'At least one country is required'),
    regions: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
  }),
  demographics: z.object({
    ageMin: z.number().min(13).max(65),
    ageMax: z.number().min(13).max(65),
    gender: z.enum(['All', 'Male', 'Female']),
    languages: z.array(z.string()).optional(),
  }),
  optimizationEvent: z.string().min(1, 'Optimization event is required'),
  budgetType: z.enum(['daily', 'lifetime']).optional(),
  budgetPerAdSet: z.number().min(5, 'Minimum budget per ad set is $5').optional(),
})

// Creative validation schema
export const creativeVersionSchema = z.object({
  file: z.instanceof(File),
  url: z.string(),
  thumbnail: z.string(),
})

export const creativeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Creative name is required'),
  format: z.enum(['Image', 'Video']),
  feedVersion: creativeVersionSchema.optional(),
  storyVersion: creativeVersionSchema.optional(),
})

export const copyVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Variant name is required'),
  headline: z.string().max(40, 'Headline must be 40 characters or less'),
  primaryText: z.string().max(125, 'Primary text must be 125 characters or less'),
  cta: z.string(),
})

export const bulkCreativesSchema = z.object({
  creatives: z.array(creativeSchema).min(1, 'At least one creative is required'),
  sameCopyForAll: z.boolean(),
  globalHeadline: z.string().max(40).optional(),
  globalPrimaryText: z.string().max(125).optional(),
  globalCTA: z.string().optional(),
  enableVariants: z.boolean(),
  copyVariants: z.array(copyVariantSchema).optional(),
})

// Full bulk launcher validation
export const bulkLauncherSchema = z
  .object({
    clientId: z.string().nullable(),
    campaign: campaignSchema,
    bulkAudiences: bulkAudiencesSchema,
    bulkCreatives: bulkCreativesSchema,
  })
  .refine(
    (data) => {
      // If CBO, totalBudget is required
      if (data.campaign.budgetMode === 'CBO') {
        return data.campaign.totalBudget !== undefined && data.campaign.totalBudget > 0
      }
      return true
    },
    {
      message: 'Total budget is required for CBO campaigns',
      path: ['campaign', 'totalBudget'],
    }
  )
  .refine(
    (data) => {
      // If ABO, budgetPerAdSet is required
      if (data.campaign.budgetMode === 'ABO') {
        return (
          data.bulkAudiences.budgetPerAdSet !== undefined && data.bulkAudiences.budgetPerAdSet > 0
        )
      }
      return true
    },
    {
      message: 'Budget per ad set is required for ABO campaigns',
      path: ['bulkAudiences', 'budgetPerAdSet'],
    }
  )
  .refine(
    (data) => {
      // Check that each creative has at least one version
      return data.bulkCreatives.creatives.every(
        (creative) => creative.feedVersion || creative.storyVersion
      )
    },
    {
      message: 'Each creative must have at least one version (feed or story)',
      path: ['bulkCreatives', 'creatives'],
    }
  )
  .refine(
    (data) => {
      // If copy variants are enabled, at least one variant is required
      if (data.bulkCreatives.enableVariants) {
        return (
          data.bulkCreatives.copyVariants && data.bulkCreatives.copyVariants.length > 0
        )
      }
      return true
    },
    {
      message: 'At least one copy variant is required when variants are enabled',
      path: ['bulkCreatives', 'copyVariants'],
    }
  )
  .refine(
    (data) => {
      // Age min must be less than age max
      return data.bulkAudiences.demographics.ageMin <= data.bulkAudiences.demographics.ageMax
    },
    {
      message: 'Minimum age must be less than or equal to maximum age',
      path: ['bulkAudiences', 'demographics', 'ageMin'],
    }
  )

// Type inference
export type BulkLauncherValidation = z.infer<typeof bulkLauncherSchema>

// Validation helper with detailed errors
export function validateBulkLauncher(data: unknown) {
  const result = bulkLauncherSchema.safeParse(data)

  if (!result.success) {
    const errors = result.error.flatten()
    return {
      success: false as const,
      errors: errors.fieldErrors,
      formattedErrors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }

  return {
    success: true as const,
    data: result.data,
  }
}

// Step-by-step validation
export function validateCampaign(data: unknown) {
  return campaignSchema.safeParse(data)
}

export function validateBulkAudiences(data: unknown) {
  return bulkAudiencesSchema.safeParse(data)
}

export function validateBulkCreatives(data: unknown) {
  return bulkCreativesSchema.safeParse(data)
}
