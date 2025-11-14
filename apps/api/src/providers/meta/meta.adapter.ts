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
   *
   * Meta Ads v24 ODAX objectives:
   * - OUTCOME_AWARENESS (Awareness)
   * - OUTCOME_TRAFFIC (Traffic)
   * - OUTCOME_ENGAGEMENT (Engagement)
   * - OUTCOME_LEADS (Leads)
   * - OUTCOME_APP_PROMOTION (AppPromotion)
   * - OUTCOME_SALES (Sales)
   */
  async createCampaign(input: CreateCampaignInput): Promise<CreateResult> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Creating campaign:', input.name)
    console.log('[MetaAdapter] Objective:', input.objective)

    // Stub: génère un ID mocké
    const mockId = `meta_campaign_${this.generateMockId()}`

    // TODO v2: When implementing real Meta API integration, use:
    // const objective = this.mapToMetaObjective(input.objective)
    // const response = await fetch(`https://graph.facebook.com/v24.0/act_${adAccountId}/campaigns`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     name: input.name,
    //     objective: objective, // Meta v24 OUTCOME_* format
    //     status: input.status,
    //     special_ad_categories: input.specialAdCategories || []
    //   })
    // })

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
   *
   * Meta Ads v24 ODAX ad set structure:
   * - optimization_goal: LINK_CLICKS, LEAD_GENERATION, REACH, etc.
   * - billing_event: IMPRESSIONS, LINK_CLICKS, THRUPLAY
   * - promoted_object: { pixel_id, custom_event_type, page_id, application_id, etc. }
   */
  async createAdSet(input: CreateAdSetInput): Promise<CreateResult> {
    await this.simulateDelay()

    console.log('[MetaAdapter] Creating ad set:', input.name)
    console.log('[MetaAdapter] Targeting:', input.targeting)

    const mockId = `meta_adset_${this.generateMockId()}`

    // TODO v2: When implementing real Meta API integration, use:
    // const response = await fetch(`https://graph.facebook.com/v24.0/act_${adAccountId}/adsets`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     name: input.name,
    //     campaign_id: input.campaignId,
    //     optimization_goal: input.optimizationGoal, // From ODAX_OPTIMIZATION_GOALS
    //     billing_event: input.billingEvent, // From OPTIMIZATION_GOAL_TO_BILLING_EVENTS
    //     bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    //     promoted_object: {
    //       pixel_id: input.pixelId,
    //       custom_event_type: input.customEventType,
    //       page_id: input.pageId,
    //       application_id: input.applicationId,
    //       object_store_url: input.objectStoreUrl
    //     },
    //     targeting: input.targeting,
    //     status: input.status
    //   })
    // })

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
