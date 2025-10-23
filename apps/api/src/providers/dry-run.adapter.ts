import {
  ProviderAdapter,
  PlatformType,
  CreateCampaignInput,
  CreateAdSetInput,
  CreateAdInput,
  CreateResult,
  MetricsScope,
  AdMetrics,
} from './provider.adapter'

/**
 * DryRunAdapter
 *
 * Adapter de test qui simule toutes les opérations sans appeler d'API réelles.
 * Utile pour le développement et les tests.
 *
 * @example
 * ```typescript
 * const adapter = new DryRunAdapter('META')
 * const campaign = await adapter.createCampaign({ name: 'Test Campaign' })
 * console.log(campaign.id) // 'dryrun_campaign_abc123'
 * ```
 */
export class DryRunAdapter implements ProviderAdapter {
  readonly name: PlatformType

  private operations: Array<{
    type: string
    input: unknown
    result: CreateResult
    timestamp: Date
  }> = []

  constructor(platform: PlatformType = 'META') {
    this.name = platform
  }

  /**
   * Simule l'authentification (toujours réussit)
   */
  async ensureAuth(orgId: string, connectionId: string): Promise<void> {
    console.log(
      `[DryRunAdapter:${this.name}] ensureAuth(orgId=${orgId}, connectionId=${connectionId})`
    )
    // Dry run: toujours réussit
  }

  /**
   * Simule la création d'une campagne
   */
  async createCampaign(input: CreateCampaignInput): Promise<CreateResult> {
    console.log(
      `[DryRunAdapter:${this.name}] createCampaign(name=${input.name})`
    )

    const result: CreateResult = {
      id: `dryrun_campaign_${this.generateId()}`,
      platform: this.name,
      createdAt: new Date(),
      ...input,
    }

    this.operations.push({
      type: 'createCampaign',
      input,
      result,
      timestamp: new Date(),
    })

    return result
  }

  /**
   * Simule la création d'un Ad Set
   */
  async createAdSet(input: CreateAdSetInput): Promise<CreateResult> {
    console.log(
      `[DryRunAdapter:${this.name}] createAdSet(name=${input.name})`
    )

    const result: CreateResult = {
      id: `dryrun_adset_${this.generateId()}`,
      platform: this.name,
      createdAt: new Date(),
      ...input,
    }

    this.operations.push({
      type: 'createAdSet',
      input,
      result,
      timestamp: new Date(),
    })

    return result
  }

  /**
   * Simule la création d'une annonce
   */
  async createAd(input: CreateAdInput): Promise<CreateResult> {
    console.log(`[DryRunAdapter:${this.name}] createAd(name=${input.name})`)

    const result: CreateResult = {
      id: `dryrun_ad_${this.generateId()}`,
      platform: this.name,
      createdAt: new Date(),
      ...input,
    }

    this.operations.push({
      type: 'createAd',
      input,
      result,
      timestamp: new Date(),
    })

    return result
  }

  /**
   * Simule la récupération de métriques
   */
  async getMetrics(
    scope: MetricsScope,
    dateFrom: string,
    dateTo: string
  ): Promise<AdMetrics[]> {
    console.log(
      `[DryRunAdapter:${this.name}] getMetrics(${JSON.stringify(scope)}, ${dateFrom}, ${dateTo})`
    )

    // Retourne des métriques de test
    return [
      {
        impressions: 10000,
        clicks: 500,
        spend: 100,
        conversions: 50,
        ctr: 5.0,
        cpc: 0.2,
        cpm: 10.0,
      },
    ]
  }

  /**
   * Retourne l'historique des opérations simulées
   */
  getOperations() {
    return this.operations
  }

  /**
   * Réinitialise l'historique
   */
  reset(): void {
    this.operations = []
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}
