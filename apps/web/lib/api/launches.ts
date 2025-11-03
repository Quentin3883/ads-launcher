import type { BulkCampaignOutput } from '@launcher-ads/sdk'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface CreateBulkLaunchPayload {
  userId: string
  clientId: string
  adAccountId: string
  campaign: BulkCampaignOutput['campaign']
  adSets: BulkCampaignOutput['adSets']
  stats: BulkCampaignOutput['stats']
}

export interface BulkLaunchResponse {
  success: boolean
  launchId: string
  campaignId: string
  stats: {
    campaign: number
    adSets: number
    ads: number
  }
  message: string
}

export interface LaunchStatus {
  id: string
  status: string
  campaignId: string
  createdAt: string
  results: any
}

/**
 * Create a bulk launch (campaign + ad sets + ads)
 */
export async function createBulkLaunch(
  payload: CreateBulkLaunchPayload
): Promise<BulkLaunchResponse> {
  const response = await fetch(`${API_URL}/launches/bulk-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create bulk launch')
  }

  return response.json()
}

/**
 * Get launch status by ID
 */
export async function getLaunchStatus(launchId: string): Promise<LaunchStatus> {
  const response = await fetch(`${API_URL}/launches/${launchId}/status`)

  if (!response.ok) {
    throw new Error('Failed to fetch launch status')
  }

  return response.json()
}

/**
 * Get all launches for a user
 */
export async function getUserLaunches(userId: string): Promise<LaunchStatus[]> {
  const response = await fetch(`${API_URL}/launches/user/${userId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch user launches')
  }

  return response.json()
}
