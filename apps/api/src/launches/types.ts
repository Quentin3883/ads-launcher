// import { BlueprintConfig } from '@launcher-ads/sdk'
// import { ProviderAdapter } from '../providers'

/**
 * Résultat de création d'une entité (campagne, adset, ad)
 */
export interface CreatedEntity {
  type: 'campaign' | 'adset' | 'ad'
  externalId: string
  name: string
  parentId?: string // ID du parent (campaign pour adset, adset pour ad)
  metadata?: Record<string, unknown>
}

/**
 * Résultat complet d'un launch
 */
export interface LaunchResult {
  blueprintId: string
  blueprintName: string
  platform: string
  created: CreatedEntity[]
  totalCreated: {
    campaigns: number
    adsets: number
    ads: number
  }
  startedAt: Date
  completedAt: Date
  durationMs: number
  errors: Array<{
    entity: string
    error: string
  }>
}

/**
 * Options pour le launch runner
 */
export interface LaunchOptions {
  dryRun?: boolean
  credentials?: Record<string, unknown>
  maxConcurrency?: number
}

/**
 * Context de l'expansion d'un blueprint
 * (Réservé pour usage futur / V2)
 */
// export interface ExpansionContext {
//   blueprint: {
//     id: string
//     name: string
//     platform: string
//     config: BlueprintConfig
//   }
//   adapter: ProviderAdapter
//   options: LaunchOptions
// }

/**
 * Paramètres d'expansion extraits du config
 */
export interface ExpansionParams {
  valueProps?: string[]
  audiences?: Array<{
    name: string
    ageMin: number
    ageMax: number
    locations: string[]
    interests: string[]
  }>
  placements?: string[]
  budget: {
    amount: number
    type: 'DAILY' | 'LIFETIME'
  }
  creative: {
    headline: string
    description: string
    imageUrl?: string
    callToAction: string
  }
}
