import { z } from 'zod'

export const launchStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
])

export const createLaunchSchema = z.object({
  blueprintId: z.string().uuid(),
  scheduledFor: z.date().optional(),
})

export const launchSchema = createLaunchSchema.extend({
  id: z.string().uuid(),
  status: launchStatusSchema,
  externalCampaignId: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type LaunchStatus = z.infer<typeof launchStatusSchema>
export type CreateLaunchInput = z.infer<typeof createLaunchSchema>
export type Launch = z.infer<typeof launchSchema>
