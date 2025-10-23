import {
  ProviderAdapter,
  CreateCampaignInput,
  CreateAdSetInput,
  CreateAdInput,
  CreateResult,
  MetricsScope,
  AdMetrics,
} from '../provider.adapter'

/**
 * MetaAdapter
 *
 * Adapter pour la plateforme Meta (Facebook / Instagram Ads).
 * Version STUB pour la V1 - retourne des données mockées.
 *
 * @example
 * ```typescript
 * const adapter = new MetaAdapter({ accessToken: 'xxx', adAccountId: '123' })
 * await adapter.ensureAuth('org-1', 'conn-1')
 * const campaign = await adapter.createCampaign({ name: 'Summer Sale', budget: { amount: 1000, type: 'DAILY' } })
 * console.log(campaign.id) // 'meta_campaign_abc123'
 * ```
 */

export interface MetaConfig {
  accessToken?: string
  adAccountId?: string
  apiVersion?: string
}

export class MetaAdapter implements ProviderAdapter {
  readonly name = 'META' as const

  private config: MetaConfig
  private mockDelay: number = 500 // Simule latence API

  constructor(config: MetaConfig = {}) {
    this.config = {
      apiVersion: 'v18.0',
      ...config,
    }
  }

  /**
   * Simule la vérification d'authentification
   */
  async ensureAuth(orgId: string, connectionId: string): Promise<void> {
    await this.simulateDelay()

    console.log(
      `[MetaAdapter] Checking auth for org=${orgId}, connection=${connectionId}`
    )

    // Stub: toujours réussit
    // En production: vérifier le token, le rafraîchir si nécessaire
    if (!this.config.accessToken) {
      console.warn(
        '[MetaAdapter] No access token configured - using stub mode'
      )
    }
  }

  /**
   * Crée une campagne Meta (mockée)
   */
  async createCampaign(input: CreateCampaignInput): Promise<CreateResult> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Creating campaign:', input.name)

    // Stub: génère un ID mocké
    const mockId = `meta_campaign_${this.generateMockId()}`

    return {
      id: mockId,
      platform: 'META',
      createdAt: new Date(),
      name: input.name,
      objective: input.objective,
      status: input.status,
    }
  }

  /**
   * Crée un Ad Set Meta (mocké)
   */
  async createAdSet(input: CreateAdSetInput): Promise<CreateResult> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Creating ad set:', input.name)

    const mockId = `meta_adset_${this.generateMockId()}`

    return {
      id: mockId,
      platform: 'META',
      createdAt: new Date(),
      name: input.name,
      campaignId: input.campaignId,
      targeting: input.targeting,
    }
  }

  /**
   * Crée une annonce Meta (mockée)
   */
  async createAd(input: CreateAdInput): Promise<CreateResult> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Creating ad:', input.name)

    const mockId = `meta_ad_${this.generateMockId()}`

    return {
      id: mockId,
      platform: 'META',
      createdAt: new Date(),
      name: input.name,
      adSetId: input.adSetId,
      creative: input.creative,
    }
  }

  /**
   * Récupère les métriques Meta (mockées)
   */
  async getMetrics(
    scope: MetricsScope,
    dateFrom: string,
    dateTo: string
  ): Promise<AdMetrics[]> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Fetching metrics:', {
      scope,
      dateFrom,
      dateTo,
    })

    // Stub: génère des métriques aléatoires
    const baseMetrics: AdMetrics = {
      impressions: this.randomInt(1000, 50000),
      clicks: this.randomInt(50, 2000),
      spend: this.randomFloat(10, 500),
      conversions: this.randomInt(5, 100),
      ctr: 0,
      cpc: 0,
      cpm: 0,
    }

    // Calcule les métriques dérivées
    baseMetrics.ctr = (baseMetrics.clicks / baseMetrics.impressions) * 100
    baseMetrics.cpc = baseMetrics.spend / baseMetrics.clicks
    baseMetrics.cpm = (baseMetrics.spend / baseMetrics.impressions) * 1000

    return [baseMetrics]
  }

  /**
   * Simule la latence réseau
   */
  private async simulateDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.mockDelay))
  }

  /**
   * Génère un ID mocké aléatoire
   */
  private generateMockId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * Génère un entier aléatoire entre min et max
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Génère un float aléatoire entre min et max
   */
  private randomFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2))
  }

  /**
   * Configure le délai de simulation (utile pour les tests)
   */
  setMockDelay(ms: number): void {
    this.mockDelay = ms
  }
}
