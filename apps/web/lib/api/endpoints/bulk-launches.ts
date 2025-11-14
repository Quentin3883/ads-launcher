import { api } from '../client'
import { z } from 'zod'

const BulkLaunchSchema = z.object({
  id: z.string(),
  name: z.string(),
  launchMode: z.string().optional(),
  status: z.string(),
  campaign: z.any().optional(),
  bulkAudiences: z.any().optional(),
  bulkCreatives: z.any().optional(),
  clientId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export type BulkLaunch = z.infer<typeof BulkLaunchSchema>

export const bulkLaunchesAPI = {
  list: (userId: string) =>
    api.get(`/bulk-launches?userId=${userId}`, z.array(BulkLaunchSchema)),

  create: (data: any) =>
    api.post('/bulk-launches', data, BulkLaunchSchema),
}
