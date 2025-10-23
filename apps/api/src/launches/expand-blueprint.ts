import { BlueprintConfig } from '@launcher-ads/sdk'
import { ExpansionParams } from './types'

/**
 * Expanse un blueprint config en paramètres d'expansion
 *
 * Extrait et structure les données du blueprint pour faciliter
 * la création des campagnes, adsets et ads.
 *
 * @param config - Configuration du blueprint
 * @returns Paramètres d'expansion structurés
 *
 * @example
 * ```typescript
 * const params = expandBlueprint(blueprint.config)
 * console.log(params.valueProps) // ['Fast', 'Reliable', 'Affordable']
 * console.log(params.audiences.length) // 3
 * ```
 */
export function expandBlueprint(config: BlueprintConfig): ExpansionParams {
  // Extrait les value props depuis le config (si disponibles)
  const valueProps = extractValueProps(config)

  // Crée les audiences à partir du targetAudience
  const audiences = createAudiences(config)

  // Budget
  const budget = {
    amount: config.budget,
    type: 'DAILY' as const,
  }

  // Creative de base
  const creative = {
    headline: config.creative.headline,
    description: config.creative.description,
    imageUrl: config.creative.imageUrl,
    callToAction: config.creative.callToAction,
  }

  return {
    valueProps,
    audiences,
    budget,
    creative,
  }
}

/**
 * Extrait les value props depuis le config
 * Par défaut, utilise le headline comme unique value prop
 */
function extractValueProps(config: BlueprintConfig): string[] {
  // Pour V1, on pourrait extraire depuis le headline
  // V2: ajouter un champ valueProps dans le BlueprintConfig
  return [config.creative.headline]
}

/**
 * Crée une liste d'audiences à partir du targetAudience
 *
 * Pour V1: crée une audience unique
 * V2: pourrait expanser en plusieurs audiences (par location, par intérêt, etc.)
 */
function createAudiences(
  config: BlueprintConfig
): ExpansionParams['audiences'] {
  const { targetAudience } = config

  // Pour V1: audience unique
  const baseAudience = {
    name: 'Primary Audience',
    ageMin: targetAudience.age.min,
    ageMax: targetAudience.age.max,
    locations: targetAudience.locations,
    interests: targetAudience.interests,
  }

  return [baseAudience]

  // V2: Expansion multi-audiences
  // Exemple: créer une audience par location
  // return targetAudience.locations.map((location, index) => ({
  //   name: `Audience ${location}`,
  //   ageMin: targetAudience.age.min,
  //   ageMax: targetAudience.age.max,
  //   locations: [location],
  //   interests: targetAudience.interests,
  // }))
}

/**
 * Génère des variations de creative basées sur les value props
 *
 * @param creative - Creative de base
 * @param valueProp - Value prop à intégrer
 * @returns Creative avec value prop intégrée
 *
 * @example
 * ```typescript
 * const variant = createCreativeVariant(
 *   { headline: 'Buy Now', description: 'Great product' },
 *   'Fast Delivery'
 * )
 * console.log(variant.headline) // 'Fast Delivery - Buy Now'
 * ```
 */
export function createCreativeVariant(
  creative: ExpansionParams['creative'],
  valueProp: string
): ExpansionParams['creative'] {
  return {
    ...creative,
    headline: `${valueProp} - ${creative.headline}`,
    description: `${valueProp}: ${creative.description}`,
  }
}

/**
 * Calcule le nombre total d'entités qui seront créées
 *
 * @param params - Paramètres d'expansion
 * @returns Nombre de campaigns, adsets, ads
 */
export function calculateExpansionSize(params: ExpansionParams): {
  campaigns: number
  adsets: number
  ads: number
} {
  const valuePropsCount = params.valueProps?.length || 1
  const audiencesCount = params.audiences?.length || 1

  return {
    campaigns: valuePropsCount,
    adsets: valuePropsCount * audiencesCount,
    ads: valuePropsCount * audiencesCount, // 1 ad per adset pour V1
  }
}
