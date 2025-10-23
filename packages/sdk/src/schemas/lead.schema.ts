import { z } from 'zod'

export const leadSourceSchema = z.enum([
  'typeform',
  'meta_lead_ad',
  'google_lead_form',
  'linkedin_lead_gen',
  'snap_lead_gen',
  'other',
])

export const createLeadSchema = z.object({
  launchId: z.string().uuid(),
  source: leadSourceSchema,
  externalLeadId: z.string().optional(),
  data: z.record(z.unknown()),
})

export const leadSchema = createLeadSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type LeadSource = z.infer<typeof leadSourceSchema>
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type Lead = z.infer<typeof leadSchema>
