import { api } from '../client'
import { z } from 'zod'

const AdAccountSchema = z.object({
  id: z.string(),
  facebookId: z.string(),
  name: z.string(),
  currency: z.string(),
  accountStatus: z.string(),
  businessName: z.string().optional(),
  clientId: z.string().optional().nullable(),
  client: z.any().optional().nullable(),
})

const AvailableAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountStatus: z.string(),
  currency: z.string(),
  timezone: z.string(),
  businessName: z.string().optional(),
  businessId: z.string().optional(),
  isSelected: z.boolean(),
})

export type AdAccount = z.infer<typeof AdAccountSchema>
export type AvailableAccount = z.infer<typeof AvailableAccountSchema>

export const facebookAPI = {
  // Get ad accounts for a user
  getAccounts: (userId: string) =>
    api.get(`/facebook/admin/accounts/${userId}`, z.array(AdAccountSchema)),

  // Get available accounts from Facebook
  getAvailableAccounts: (userId: string) =>
    api.get(`/facebook/admin/available-accounts/${userId}`, z.array(AvailableAccountSchema)),

  // Save selected accounts
  saveAccounts: (userId: string, accountIds: string[]) =>
    api.post(`/facebook/admin/save-accounts/${userId}`, { accountIds }),

  // Link ad account to client
  linkAdAccountToClient: (adAccountId: string, clientId: string | null) =>
    api.post(`/facebook/admin/ad-accounts/${adAccountId}/link-client`, { clientId }),

  // Delete ad account
  deleteAdAccount: (adAccountId: string) =>
    api.delete(`/facebook/admin/ad-accounts/${adAccountId}`),

  // Sync campaigns insights
  syncCampaignsInsights: (userId: string, datePreset: string = 'last_30d') =>
    api.post(`/facebook/campaigns-insights/${userId}/sync`, { datePreset }),
}
