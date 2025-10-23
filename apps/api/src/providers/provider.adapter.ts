/**
 * ProviderAdapter Interface
 *
 * Abstraction commune pour gérer les campagnes publicitaires
 * sur différentes plateformes (Meta, Google, LinkedIn, Snap).
 *
 * @example
 * ```typescript
 * const adapter = new MetaAdapter(credentials)
 * await adapter.ensureAuth('org-123', 'connection-456')
 * const campaign = await adapter.createCampaign({ name: 'My Campaign', budget: 1000 })
 * ```
 */

/**
 * Type de plateforme supportée
 */
export type PlatformType = 'META' | 'GOOGLE' | 'LINKEDIN' | 'SNAP'

/**
 * Scope pour récupérer les métriques
 */
export interface MetricsScope {
  campaignId?: string
  adSetId?: string
  adId?: string
}

/**
 * Métriques publicitaires communes
 */
export interface AdMetrics {
  impressions: number
  clicks: number
  spend: number
  conversions?: number
  ctr?: number
  cpc?: number
  cpm?: number
  [key: string]: unknown // Métriques spécifiques à la plateforme
}

/**
 * Input pour créer une campagne
 */
export interface CreateCampaignInput {
  name: string
  objective: string
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
  budget?: {
    amount: number
    type: 'DAILY' | 'LIFETIME'
  }
  startTime?: Date
  endTime?: Date
  [key: string]: unknown // Paramètres spécifiques à la plateforme
}

/**
 * Input pour créer un Ad Set (groupe d'annonces)
 */
export interface CreateAdSetInput {
  campaignId: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
  targeting?: {
    ageMin?: number
    ageMax?: number
    locations?: string[]
    interests?: string[]
    [key: string]: unknown
  }
  budget?: {
    amount: number
    type: 'DAILY' | 'LIFETIME'
  }
  billingEvent?: string
  optimizationGoal?: string
  [key: string]: unknown
}

/**
 * Input pour créer une annonce
 */
export interface CreateAdInput {
  adSetId: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
  creative: {
    title: string
    body: string
    imageUrl?: string
    videoUrl?: string
    callToAction?: string
    link?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Résultat de création (contient l'ID externe de la plateforme)
 */
export interface CreateResult {
  id: string
  platform: PlatformType
  createdAt: Date
  [key: string]: unknown
}

/**
 * Interface principale pour tous les adapters de plateformes publicitaires
 */
export interface ProviderAdapter {
  /**
   * Nom de la plateforme
   */
  readonly name: PlatformType

  /**
   * Vérifie et rafraîchit l'authentification pour une organisation/connexion
   *
   * @param orgId - ID de l'organisation
   * @param connectionId - ID de la connexion à la plateforme
   * @throws {Error} Si l'authentification échoue
   */
  ensureAuth(orgId: string, connectionId: string): Promise<void>

  /**
   * Crée une campagne publicitaire
   *
   * @param input - Paramètres de la campagne
   * @returns Résultat avec l'ID externe de la campagne
   * @throws {Error} Si la création échoue
   */
  createCampaign(input: CreateCampaignInput): Promise<CreateResult>

  /**
   * Crée un Ad Set (groupe d'annonces)
   *
   * @param input - Paramètres de l'Ad Set
   * @returns Résultat avec l'ID externe de l'Ad Set
   * @throws {Error} Si la création échoue
   */
  createAdSet(input: CreateAdSetInput): Promise<CreateResult>

  /**
   * Crée une annonce
   *
   * @param input - Paramètres de l'annonce
   * @returns Résultat avec l'ID externe de l'annonce
   * @throws {Error} Si la création échoue
   */
  createAd(input: CreateAdInput): Promise<CreateResult>

  /**
   * Récupère les métriques de performance
   *
   * @param scope - Scope des métriques (campaign, adSet, ad)
   * @param dateFrom - Date de début (format ISO 8601)
   * @param dateTo - Date de fin (format ISO 8601)
   * @returns Liste des métriques pour chaque entité
   * @throws {Error} Si la récupération échoue
   */
  getMetrics(
    scope: MetricsScope,
    dateFrom: string,
    dateTo: string
  ): Promise<AdMetrics[]>
}

/**
 * Type guard pour vérifier si un objet est un ProviderAdapter
 */
export function isProviderAdapter(obj: unknown): obj is ProviderAdapter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'ensureAuth' in obj &&
    'createCampaign' in obj &&
    'createAdSet' in obj &&
    'createAd' in obj &&
    'getMetrics' in obj
  )
}
