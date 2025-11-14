/**
 * Campaign Configuration Helpers
 * Auto-complétion et validation des configurations de campagne Facebook API v24 ODAX
 */

import type { CampaignConfig } from '../schemas/bulk-launcher.schema'
import {
  ODAX_OPTIMIZATION_GOALS,
  DEFAULT_OPTIMIZATION_GOAL,
  OPTIMIZATION_GOAL_TO_BILLING_EVENTS,
  getAvailableDestinations,
  requiresPixel,
  getRequiredPromotedObjectFields as getRequiredFieldsFromSchema,
} from '../schemas/bulk-launcher.schema'

/**
 * Auto-complète les champs manquants d'une campagne selon son objectif
 * Utilise les valeurs recommandées par Facebook API v24 ODAX
 */
export function autoCompleteCampaignConfig(
  campaign: Partial<CampaignConfig>
): CampaignConfig {
  const campaignType = campaign.type

  // Si pas d'objectif, retourner tel quel
  if (!campaignType) {
    return campaign as CampaignConfig
  }

  // Destination type par défaut
  let destinationType = campaign.destinationType
  if (!destinationType) {
    // Map old redirectionType to new destinationType
    if (campaign.redirectionType === 'LANDING_PAGE') {
      destinationType = 'WEBSITE'
    } else if (campaign.redirectionType === 'DEEPLINK') {
      destinationType = 'APP'
    } else if (campaign.redirectionType === 'LEAD_FORM') {
      destinationType = 'ON_AD'
    } else {
      // Default: use NONE for most objectives
      const allowedDestinations = getAvailableDestinations(campaignType)
      destinationType = allowedDestinations[0] // NONE for most
    }
  }

  // Optimization goal par défaut basé sur objective + destination
  let optimizationGoal = campaign.optimizationGoal
  if (!optimizationGoal && destinationType) {
    const defaultGoal = DEFAULT_OPTIMIZATION_GOAL[campaignType]?.[destinationType]
    optimizationGoal = defaultGoal || ODAX_OPTIMIZATION_GOALS[campaignType]?.[destinationType]?.[0]
  }

  // Billing event depuis optimization goal
  let billingEvent = campaign.billingEvent
  if (!billingEvent && optimizationGoal) {
    const allowedBillingEvents = OPTIMIZATION_GOAL_TO_BILLING_EVENTS[optimizationGoal]
    billingEvent = allowedBillingEvents?.[0] || 'IMPRESSIONS'
  }

  // Bid strategy et buying type par défaut
  const bidStrategy = campaign.bidStrategy || 'LOWEST_COST_WITHOUT_CAP'
  const buyingType = campaign.buyingType || 'AUCTION'

  // Special Ad Categories par défaut (vide si non spécifié)
  const specialAdCategories = campaign.specialAdCategories || []
  const specialAdCategoryCountry = campaign.specialAdCategoryCountry || []

  return {
    ...campaign,
    objective: campaignType, // Keep as CampaignType (not converted)
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
 * Meta Ads v24 ODAX validation
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
    errors.push('Le type de campagne (objective) est requis')
  }

  // Validation destination
  const dest = campaign.destinationType
  const obj = campaign.type

  if (dest === 'WEBSITE' && !campaign.redirectionUrl) {
    errors.push('URL de destination requise pour destination WEBSITE')
  }

  if (dest === 'ON_AD' && !campaign.redirectionFormId) {
    errors.push('Lead form ID requis pour destination ON_AD')
  }

  if (dest === 'APP' && (!campaign.applicationId || !campaign.objectStoreUrl)) {
    errors.push('application_id et object_store_url requis pour destination APP')
  }

  // Validation optimization goal compatible avec objective + destination
  if (obj && dest && campaign.optimizationGoal) {
    const allowedGoals = ODAX_OPTIMIZATION_GOALS[obj]?.[dest]
    if (allowedGoals && !allowedGoals.includes(campaign.optimizationGoal)) {
      errors.push(
        `Optimization goal "${campaign.optimizationGoal}" incompatible avec ${obj} + ${dest}. Autorisés: ${allowedGoals.join(', ')}`
      )
    }
  }

  // Validation billing event compatible avec optimization goal
  if (campaign.optimizationGoal && campaign.billingEvent) {
    const allowedBilling = OPTIMIZATION_GOAL_TO_BILLING_EVENTS[campaign.optimizationGoal]
    if (allowedBilling && !allowedBilling.includes(campaign.billingEvent)) {
      errors.push(
        `Billing event "${campaign.billingEvent}" incompatible avec optimization goal "${campaign.optimizationGoal}". Autorisés: ${allowedBilling.join(', ')}`
      )
    }
  }

  // Validation pixel requirements
  if (obj && dest && campaign.optimizationGoal) {
    const needsPixel = requiresPixel(obj, dest, campaign.optimizationGoal)
    if (needsPixel && !campaign.pixelId) {
      errors.push(`Facebook Pixel requis pour ${obj} avec optimization goal ${campaign.optimizationGoal}`)
    }
  }

  // Validation promoted_object fields
  if (obj && dest && campaign.optimizationGoal) {
    const requiredFields = getRequiredFieldsFromSchema(obj, dest, campaign.optimizationGoal)
    requiredFields.forEach((field: string) => {
      if (field === 'page_id' && !campaign.pageId) {
        errors.push('page_id requis pour cette configuration')
      }
      if (field === 'pixel_id' && !campaign.pixelId) {
        errors.push('pixel_id requis pour cette configuration')
      }
      if (field === 'custom_event_type' && !campaign.customEventType) {
        warnings.push('custom_event_type recommandé pour le tracking des conversions')
      }
      if (field === 'application_id' && !campaign.applicationId) {
        errors.push('application_id requis pour les campagnes APP')
      }
      if (field === 'object_store_url' && !campaign.objectStoreUrl) {
        errors.push('object_store_url requis pour les campagnes APP')
      }
    })
  }

  // Validation budget
  if (!campaign.budget || campaign.budget <= 0) {
    warnings.push('Budget non défini ou invalide')
  }

  // Validation dates
  if (!campaign.startDate) {
    errors.push('Date de début requise')
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
