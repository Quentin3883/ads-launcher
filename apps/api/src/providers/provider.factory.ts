import { ProviderAdapter, PlatformType } from './provider.adapter'
import { MetaAdapter } from './meta/meta.adapter'
import { DryRunAdapter } from './dry-run.adapter'

/**
 * Configuration pour créer un adapter
 */
export interface AdapterConfig {
  platform: PlatformType
  dryRun?: boolean
  credentials?: {
    accessToken?: string
    adAccountId?: string
    [key: string]: unknown
  }
}

/**
 * Factory pour créer les bons adapters selon la plateforme
 *
 * @example
 * ```typescript
 * // Production mode
 * const adapter = ProviderFactory.create({
 *   platform: 'META',
 *   credentials: { accessToken: 'xxx', adAccountId: '123' }
 * })
 *
 * // Dry run mode (test)
 * const dryAdapter = ProviderFactory.create({
 *   platform: 'META',
 *   dryRun: true
 * })
 * ```
 */
export class ProviderFactory {
  /**
   * Crée un adapter pour la plateforme donnée
   */
  static create(config: AdapterConfig): ProviderAdapter {
    // Mode dry run: retourne un adapter de test
    if (config.dryRun) {
      console.log(`[ProviderFactory] Creating DryRunAdapter for ${config.platform}`)
      return new DryRunAdapter(config.platform)
    }

    // Mode production: crée l'adapter réel selon la plateforme
    switch (config.platform) {
      case 'META':
        console.log('[ProviderFactory] Creating MetaAdapter')
        return new MetaAdapter(config.credentials || {})

      case 'GOOGLE':
        // TODO: Implémenter GoogleAdapter
        throw new Error('GoogleAdapter not implemented yet')

      case 'LINKEDIN':
        // TODO: Implémenter LinkedInAdapter
        throw new Error('LinkedInAdapter not implemented yet')

      case 'SNAP':
        // TODO: Implémenter SnapAdapter
        throw new Error('SnapAdapter not implemented yet')

      default:
        throw new Error(`Unsupported platform: ${config.platform}`)
    }
  }

  /**
   * Liste toutes les plateformes supportées
   */
  static getSupportedPlatforms(): PlatformType[] {
    return ['META', 'GOOGLE', 'LINKEDIN', 'SNAP']
  }

  /**
   * Vérifie si une plateforme est supportée
   */
  static isPlatformSupported(platform: string): platform is PlatformType {
    return this.getSupportedPlatforms().includes(platform as PlatformType)
  }
}
