/**
 * Campaign Configuration Helpers
 * Auto-complétion et validation des configurations de campagne Facebook API v24
 */

import type { CampaignConfig } from '../schemas/bulk-launcher.schema'
import {
  type FacebookObjective,
  type OptimizationGoal,
  type BillingEvent,
  type DestinationType,
  DEFAULT_OPTIMIZATION_GOAL,
  DEFAULT_BILLING_EVENT,
  DEFAULT_BID_STRATEGY,
  DEFAULT_BUYING_TYPE,
  OBJECTIVE_TO_DESTINATION_TYPES,
  validateCampaignConfig,
} from '../constants/facebook-api-v24-config'
import { CAMPAIGN_TYPE_TO_OBJECTIVE } from '../constants/facebook-mappings'

/**
 * Auto-complète les champs manquants d'une campagne selon son objectif
 * Utilise les valeurs recommandées par Facebook API v24
 */
export function autoCompleteCampaignConfig(
  campaign: Partial<CampaignConfig>
): CampaignConfig {
  // Déterminer l'objectif Facebook depuis le type de campagne
  let facebookObjective: FacebookObjective | undefined

  if (campaign.type) {
    facebookObjective = CAMPAIGN_TYPE_TO_OBJECTIVE[campaign.type] as FacebookObjective
  }

  // Si pas d'objectif déterminable, retourner la campagne telle quelle
  if (!facebookObjective) {
    return campaign as CampaignConfig
  }

  // Configuration recommandée
  const optimizationGoal = campaign.optimizationGoal || DEFAULT_OPTIMIZATION_GOAL[facebookObjective]
  const billingEvent = campaign.billingEvent || DEFAULT_BILLING_EVENT[facebookObjective]
  const bidStrategy = campaign.bidStrategy || DEFAULT_BID_STRATEGY
  const buyingType = campaign.buyingType || DEFAULT_BUYING_TYPE

  // Destination type par défaut
  let destinationType = campaign.destinationType
  if (!destinationType) {
    const allowedDestinations = OBJECTIVE_TO_DESTINATION_TYPES[facebookObjective]
    // Choisir le premier autorisé par défaut
    if (campaign.redirectionType === 'LANDING_PAGE') {
      destinationType = 'WEBSITE'
    } else if (campaign.redirectionType === 'DEEPLINK') {
      destinationType = 'APP'
    } else if (campaign.redirectionType === 'LEAD_FORM') {
      destinationType = 'ON_AD'
    } else {
      destinationType = allowedDestinations[0]
    }
  }

  // Special Ad Categories par défaut (vide si non spécifié)
  const specialAdCategories = campaign.specialAdCategories || []
  const specialAdCategoryCountry = campaign.specialAdCategoryCountry || []

  return {
    ...campaign,
    objective: facebookObjective,
    optimizationGoal,
    billingEvent,
    bidStrategy,
    buyingType,
    destinationType,
    specialAdCategories,
    specialAdCategoryCountry,
  } as CampaignConfig
}

/**
 * Valide une configuration de campagne et retourne les erreurs
 */
export function validateCampaignConfiguration(campaign: Partial<CampaignConfig>): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validation des champs requis de base
  if (!campaign.name || campaign.name.trim() === '') {
    errors.push('Le nom de la campagne est requis')
  }

  if (!campaign.type) {
    errors.push('Le type de campagne est requis')
  }

  if (!campaign.redirectionType) {
    errors.push('Le type de redirection est requis')
  }

  // Validation de la redirection selon le type
  if (campaign.redirectionType === 'LANDING_PAGE' && !campaign.redirectionUrl) {
    errors.push('URL de destination requise pour redirectionType = LANDING_PAGE')
  }

  if (campaign.redirectionType === 'LEAD_FORM' && !campaign.redirectionFormId) {
    warnings.push('Aucun formulaire de lead spécifié')
  }

  if (campaign.redirectionType === 'DEEPLINK' && !campaign.redirectionDeeplink) {
    errors.push('Deeplink requis pour redirectionType = DEEPLINK')
  }

  // Validation budget
  if (!campaign.budget || campaign.budget <= 0) {
    warnings.push('Budget non défini ou invalide')
  }

  // Validation dates
  if (!campaign.startDate) {
    errors.push('Date de début requise')
  }

  // Validation Facebook API v24
  if (campaign.objective && campaign.optimizationGoal && campaign.billingEvent) {
    const fbValidation = validateCampaignConfig({
      objective: campaign.objective as FacebookObjective,
      optimization_goal: campaign.optimizationGoal as OptimizationGoal,
      billing_event: campaign.billingEvent as BillingEvent,
      destination_type: campaign.destinationType as DestinationType,
      promoted_object: {
        pixel_id: campaign.pixelId,
        page_id: undefined, // Géré au niveau ad set
        application_id: campaign.applicationId,
        object_store_url: campaign.objectStoreUrl,
        product_catalog_id: campaign.productCatalogId,
        custom_event_type: campaign.customEventType,
      },
      special_ad_categories: campaign.specialAdCategories as any,
    })

    if (!fbValidation.valid) {
      errors.push(...fbValidation.errors)
    }
  }

  // Warnings pour Special Ad Categories
  if (campaign.specialAdCategories && campaign.specialAdCategories.length > 0) {
    warnings.push(
      'Special Ad Categories activées : ciblage restreint (pas de ciblage par âge/sexe/intérêts précis)'
    )

    if (
      !campaign.specialAdCategoryCountry ||
      campaign.specialAdCategoryCountry.length === 0
    ) {
      errors.push('special_ad_category_country requis quand special_ad_categories est défini')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Détermine les champs promoted_object requis pour un optimization goal donné
 */
export function getRequiredPromotedObjectFields(
  optimizationGoal: OptimizationGoal
): {
  pixelId: boolean
  pageId: boolean
  applicationId: boolean
  objectStoreUrl: boolean
  customEventType: boolean
  productCatalogId: boolean
} {
  // Par défaut, rien n'est requis
  const requirements = {
    pixelId: false,
    pageId: false,
    applicationId: false,
    objectStoreUrl: false,
    customEventType: false,
    productCatalogId: false,
  }

  // Conversions off-Facebook
  if (optimizationGoal === 'OFFSITE_CONVERSIONS') {
    requirements.pixelId = true
  }

  // Lead Generation
  if (optimizationGoal === 'LEAD_GENERATION') {
    requirements.pageId = true
  }

  // App Installs
  if (optimizationGoal === 'APP_INSTALLS') {
    requirements.applicationId = true
    requirements.objectStoreUrl = true
  }

  // Engagement
  if (optimizationGoal === 'POST_ENGAGEMENT') {
    requirements.pageId = true
  }

  return requirements
}

/**
 * Suggère des améliorations pour une configuration de campagne
 */
export function suggestCampaignImprovements(
  campaign: Partial<CampaignConfig>
): string[] {
  const suggestions: string[] = []

  // Budget suggestions
  if (campaign.budget && campaign.budget < 10) {
    suggestions.push('Budget très faible (< 10€/jour) : résultats limités attendus')
  }

  if (campaign.budgetType === 'lifetime' && !campaign.endDate) {
    suggestions.push('Budget à vie défini mais pas de date de fin : définir endDate recommandé')
  }

  // Optimization suggestions
  if (campaign.type === 'Traffic' && campaign.optimizationGoal === 'LINK_CLICKS') {
    suggestions.push(
      'Pour du trafic qualifié, considérez LANDING_PAGE_VIEWS au lieu de LINK_CLICKS'
    )
  }

  if (campaign.type === 'Sales' && !campaign.pixelId) {
    suggestions.push('Pixel Facebook fortement recommandé pour optimiser les conversions')
  }

  if (campaign.type === 'Leads' && campaign.redirectionType === 'LANDING_PAGE') {
    suggestions.push(
      'Pour maximiser les leads, considérez LEAD_FORM (formulaires natifs Facebook) au lieu de redirections externes'
    )
  }

  // Bid strategy suggestions
  if (campaign.bidStrategy === 'LOWEST_COST_WITHOUT_CAP' && campaign.budget && campaign.budget > 100) {
    suggestions.push(
      'Pour budget élevé (> 100€/jour), considérez COST_CAP pour contrôler les coûts par résultat'
    )
  }

  return suggestions
}
