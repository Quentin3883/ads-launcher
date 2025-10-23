import { z } from 'zod'

export const blueprintStatusSchema = z.enum(['draft', 'active', 'archived'])

export const blueprintPlatformSchema = z.enum([
  'meta',
  'google',
  'linkedin',
  'snap',
])

export const blueprintConfigSchema = z.object({
  budget: z.number().positive(),
  duration: z.number().int().positive(),
  targetAudience: z.object({
    age: z.object({
      min: z.number().int().min(13),
      max: z.number().int().max(65),
    }),
    locations: z.array(z.string()),
    interests: z.array(z.string()),
  }),
  creative: z.object({
    headline: z.string().min(1).max(255),
    description: z.string().min(1).max(2000),
    imageUrl: z.string().url().optional(),
    callToAction: z.string().min(1).max(50),
  }),
})

export const createBlueprintSchema = z.object({
  name: z.string().min(1).max(255),
  platform: blueprintPlatformSchema,
  config: blueprintConfigSchema,
  status: blueprintStatusSchema.optional().default('draft'),
})

export const updateBlueprintSchema = createBlueprintSchema.partial()

export const blueprintSchema = createBlueprintSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type BlueprintStatus = z.infer<typeof blueprintStatusSchema>
export type BlueprintPlatform = z.infer<typeof blueprintPlatformSchema>
export type BlueprintConfig = z.infer<typeof blueprintConfigSchema>
export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>
export type Blueprint = z.infer<typeof blueprintSchema>
