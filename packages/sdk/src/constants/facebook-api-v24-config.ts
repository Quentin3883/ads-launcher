/**
 * Facebook API v24.0 - Configuration complète
 * Documentation de référence pour toutes les campagnes Facebook/Meta
 *
 * Structure hiérarchique: Campaign > Ad Set > Ad > Creative
 */

// ============================================
// 1️⃣ OBJECTIVES (API v24)
// ============================================

export type FacebookObjective =
  | 'OUTCOME_AWARENESS'      // Notoriété
  | 'OUTCOME_TRAFFIC'        // Trafic vers site/app
  | 'OUTCOME_ENGAGEMENT'     // Interactions
  | 'OUTCOME_LEADS'          // Formulaires lead natifs
  | 'OUTCOME_APP_PROMOTION'  // Installation d'app
  | 'OUTCOME_SALES'          // Conversions & ventes

export const FACEBOOK_OBJECTIVES: Record<string, FacebookObjective> = {
  AWARENESS: 'OUTCOME_AWARENESS',
  TRAFFIC: 'OUTCOME_TRAFFIC',
  ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
  LEADS: 'OUTCOME_LEADS',
  APP_PROMOTION: 'OUTCOME_APP_PROMOTION',
  SALES: 'OUTCOME_SALES',
} as const

// ============================================
// 2️⃣ OPTIMIZATION GOALS
// ============================================

export type OptimizationGoal =
  | 'REACH'                      // Portée maximale
  | 'AD_RECALL_LIFT'             // Mémorisation publicitaire
  | 'LINK_CLICKS'                // Clics sur lien
  | 'LANDING_PAGE_VIEWS'         // Vues page destination
  | 'POST_ENGAGEMENT'            // Engagement publication
  | 'LEAD_GENERATION'            // Génération de leads (on-Facebook)
  | 'OFFSITE_CONVERSIONS'        // Conversions hors Facebook
  | 'APP_INSTALLS'               // Installations app
  | 'VALUE'                      // Valeur de conversion
  | 'THRUPLAY'                   // Lecture vidéo complète

/**
 * Mapping: Objective → Optimization Goals autorisés
 */
export const OBJECTIVE_TO_OPTIMIZATION_GOALS: Record<FacebookObjective, OptimizationGoal[]> = {
  OUTCOME_AWARENESS: ['REACH', 'AD_RECALL_LIFT'],
  OUTCOME_TRAFFIC: ['LINK_CLICKS', 'LANDING_PAGE_VIEWS'],
  OUTCOME_ENGAGEMENT: ['POST_ENGAGEMENT'],
  OUTCOME_LEADS: ['LEAD_GENERATION', 'OFFSITE_CONVERSIONS'], // Lead Form ou redirect
  OUTCOME_APP_PROMOTION: ['APP_INSTALLS', 'LINK_CLICKS'],
  OUTCOME_SALES: ['OFFSITE_CONVERSIONS', 'VALUE'],
}

/**
 * Optimization Goals par défaut (recommandés)
 */
export const DEFAULT_OPTIMIZATION_GOAL: Record<FacebookObjective, OptimizationGoal> = {
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_ENGAGEMENT: 'POST_ENGAGEMENT',
  OUTCOME_LEADS: 'LEAD_GENERATION',
  OUTCOME_APP_PROMOTION: 'APP_INSTALLS',
  OUTCOME_SALES: 'OFFSITE_CONVERSIONS',
}

// ============================================
// 3️⃣ BILLING EVENTS
// ============================================

export type BillingEvent =
  | 'IMPRESSIONS'               // Facturation par impression (défaut)
  | 'LINK_CLICKS'               // Facturation par clic
  | 'APP_INSTALLS'              // Facturation par installation
  | 'THRUPLAY'                  // Facturation par lecture vidéo complète

/**
 * Mapping: Objective → Billing Events autorisés
 */
export const OBJECTIVE_TO_BILLING_EVENTS: Record<FacebookObjective, BillingEvent[]> = {
  OUTCOME_AWARENESS: ['IMPRESSIONS'],
  OUTCOME_TRAFFIC: ['IMPRESSIONS', 'LINK_CLICKS'],
  OUTCOME_ENGAGEMENT: ['IMPRESSIONS'],
  OUTCOME_LEADS: ['IMPRESSIONS'],
  OUTCOME_APP_PROMOTION: ['IMPRESSIONS', 'APP_INSTALLS'],
  OUTCOME_SALES: ['IMPRESSIONS'],
}

export const DEFAULT_BILLING_EVENT: Record<FacebookObjective, BillingEvent> = {
  OUTCOME_AWARENESS: 'IMPRESSIONS',
  OUTCOME_TRAFFIC: 'IMPRESSIONS',
  OUTCOME_ENGAGEMENT: 'IMPRESSIONS',
  OUTCOME_LEADS: 'IMPRESSIONS',
  OUTCOME_APP_PROMOTION: 'IMPRESSIONS',
  OUTCOME_SALES: 'IMPRESSIONS',
}

// ============================================
// 4️⃣ PROMOTED OBJECT (Dépendances)
// ============================================

export interface PromotedObject {
  pixel_id?: string              // Pour conversions hors Facebook
  custom_event_type?: string     // Type d'événement (ex: 'PURCHASE', 'LEAD')
  page_id?: string               // Page Facebook (obligatoire pour creatives)
  application_id?: string        // App mobile
  object_store_url?: string      // URL App Store/Play Store
  product_catalog_id?: string    // Catalogue produits
  product_set_id?: string        // Ensemble de produits
}

/**
 * Mapping: Objective + Optimization Goal → Promoted Object requis
 */
export interface PromotedObjectRequirements {
  pixel_id?: 'required' | 'optional'
  page_id?: 'required' | 'optional'
  application_id?: 'required' | 'optional'
  object_store_url?: 'required' | 'optional'
  product_catalog_id?: 'required' | 'optional'
  custom_event_type?: 'required' | 'optional'
}

export const PROMOTED_OBJECT_REQUIREMENTS: Record<
  string, // Format: "OBJECTIVE:OPTIMIZATION_GOAL"
  PromotedObjectRequirements
> = {
  // AWARENESS
  'OUTCOME_AWARENESS:REACH': {
    page_id: 'optional',
  },
  'OUTCOME_AWARENESS:AD_RECALL_LIFT': {
    page_id: 'optional',
  },

  // TRAFFIC
  'OUTCOME_TRAFFIC:LINK_CLICKS': {
    page_id: 'optional',
  },
  'OUTCOME_TRAFFIC:LANDING_PAGE_VIEWS': {
    page_id: 'optional',
  },

  // ENGAGEMENT
  'OUTCOME_ENGAGEMENT:POST_ENGAGEMENT': {
    page_id: 'required', // Page obligatoire pour engagement
  },

  // LEADS
  'OUTCOME_LEADS:LEAD_GENERATION': {
    page_id: 'required', // Lead Form natif Facebook
  },
  'OUTCOME_LEADS:OFFSITE_CONVERSIONS': {
    pixel_id: 'required',
    custom_event_type: 'required', // Ex: 'LEAD'
    page_id: 'optional',
  },

  // APP PROMOTION
  'OUTCOME_APP_PROMOTION:APP_INSTALLS': {
    application_id: 'required',
    object_store_url: 'required',
    page_id: 'optional',
  },
  'OUTCOME_APP_PROMOTION:LINK_CLICKS': {
    application_id: 'required',
    object_store_url: 'required',
    page_id: 'optional',
  },

  // SALES
  'OUTCOME_SALES:OFFSITE_CONVERSIONS': {
    pixel_id: 'required',
    custom_event_type: 'optional', // Ex: 'PURCHASE', 'ADD_TO_CART'
    page_id: 'optional',
  },
  'OUTCOME_SALES:VALUE': {
    pixel_id: 'required',
    custom_event_type: 'optional',
    page_id: 'optional',
  },
}

// ============================================
// 5️⃣ DESTINATION TYPES
// ============================================

export type DestinationType =
  | 'WEBSITE'                    // Site web externe
  | 'APP'                        // Application mobile
  | 'MESSENGER'                  // Messenger
  | 'WHATSAPP'                   // WhatsApp
  | 'FACEBOOK'                   // Destination sur Facebook
  | 'INSTAGRAM_DIRECT'           // Instagram Direct
  | 'ON_AD'                      // Lead Form natif
  | 'ON_POST'                    // Post engagement
  | 'ON_VIDEO'                   // Vidéo engagement

/**
 * Mapping: Objective → Destination Types autorisés
 */
export const OBJECTIVE_TO_DESTINATION_TYPES: Record<FacebookObjective, DestinationType[]> = {
  OUTCOME_AWARENESS: ['WEBSITE', 'APP', 'FACEBOOK', 'MESSENGER', 'WHATSAPP'],
  OUTCOME_TRAFFIC: ['WEBSITE', 'APP', 'MESSENGER', 'WHATSAPP', 'INSTAGRAM_DIRECT'],
  OUTCOME_ENGAGEMENT: ['ON_POST', 'ON_VIDEO', 'FACEBOOK'],
  OUTCOME_LEADS: ['ON_AD', 'WEBSITE', 'MESSENGER', 'INSTAGRAM_DIRECT'],
  OUTCOME_APP_PROMOTION: ['APP'],
  OUTCOME_SALES: ['WEBSITE', 'APP', 'MESSENGER', 'WHATSAPP'],
}

// ============================================
// 6️⃣ SPECIAL AD CATEGORIES (SAC)
// ============================================

export type SpecialAdCategory =
  | 'HOUSING'                    // Logement
  | 'EMPLOYMENT'                 // Emploi
  | 'CREDIT'                     // Crédit
  | 'ISSUES_ELECTIONS_POLITICS'  // Politique/Social

/**
 * Contraintes de ciblage pour Special Ad Categories
 * Ces catégories INTERDISENT le ciblage précis (âge, sexe, intérêts détaillés)
 */
export const SAC_TARGETING_RESTRICTIONS: Record<SpecialAdCategory, string[]> = {
  HOUSING: [
    'Pas de ciblage par âge spécifique (18-65+ uniquement)',
    'Pas de ciblage par sexe',
    'Pas de ciblage par intérêts détaillés',
    'Géolocalisation large uniquement (15 miles minimum)',
  ],
  EMPLOYMENT: [
    'Pas de ciblage par âge spécifique',
    'Pas de ciblage par sexe',
    'Pas de ciblage par intérêts détaillés',
    'Géolocalisation large uniquement',
  ],
  CREDIT: [
    'Pas de ciblage par âge spécifique',
    'Pas de ciblage par sexe',
    'Pas de ciblage par intérêts détaillés',
    'Géolocalisation large uniquement',
  ],
  ISSUES_ELECTIONS_POLITICS: [
    'Autorisation spéciale requise',
    'Disclaimer obligatoire',
    'Archivage public des pubs',
  ],
}

// ============================================
// 7️⃣ CREATIVE FORMATS
// ============================================

export type FacebookCreativeFormat =
  | 'SINGLE_IMAGE'               // Image unique
  | 'SINGLE_VIDEO'               // Vidéo unique
  | 'CAROUSEL'                   // Carrousel (2-10 cartes)
  | 'COLLECTION'                 // Collection (catalogue)
  | 'DYNAMIC_CREATIVE'           // Creative dynamique (DCO)

/**
 * Formats compatibles par objectif
 */
export const OBJECTIVE_TO_CREATIVE_FORMATS: Record<FacebookObjective, FacebookCreativeFormat[]> = {
  OUTCOME_AWARENESS: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
  OUTCOME_TRAFFIC: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL', 'COLLECTION'],
  OUTCOME_ENGAGEMENT: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
  OUTCOME_LEADS: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
  OUTCOME_APP_PROMOTION: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
  OUTCOME_SALES: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL', 'COLLECTION', 'DYNAMIC_CREATIVE'],
}

// ============================================
// 8️⃣ CONVERSION EVENTS (Pixels)
// ============================================

/**
 * Événements de conversion Facebook standard
 */
export const STANDARD_EVENTS = [
  'PURCHASE',                    // Achat
  'LEAD',                        // Lead généré
  'COMPLETE_REGISTRATION',       // Inscription complète
  'ADD_TO_CART',                 // Ajout au panier
  'ADD_TO_WISHLIST',            // Ajout à la liste de souhaits
  'INITIATE_CHECKOUT',          // Début du paiement
  'ADD_PAYMENT_INFO',           // Ajout info paiement
  'CONTACT',                     // Contact
  'SCHEDULE',                    // Prise de RDV
  'START_TRIAL',                // Début essai gratuit
  'SUBMIT_APPLICATION',         // Soumission candidature
  'SUBSCRIBE',                  // Abonnement
  'VIEW_CONTENT',               // Vue de contenu
  'SEARCH',                     // Recherche
] as const

// ============================================
// 9️⃣ BUYING TYPE
// ============================================

export type BuyingType =
  | 'AUCTION'                    // Enchères (défaut)
  | 'RESERVED'                   // Réservé (reach & frequency)

export const DEFAULT_BUYING_TYPE: BuyingType = 'AUCTION'

// ============================================
// 🔟 BID STRATEGY
// ============================================

export type BidStrategy =
  | 'LOWEST_COST_WITHOUT_CAP'    // Coût le plus bas (défaut)
  | 'LOWEST_COST_WITH_BID_CAP'   // Avec plafond de coût
  | 'COST_CAP'                   // Plafond de coût par résultat
  | 'LOWEST_COST_WITH_MIN_ROAS'  // ROAS minimum

export const DEFAULT_BID_STRATEGY: BidStrategy = 'LOWEST_COST_WITHOUT_CAP'

// ============================================
// 📋 VALIDATION HELPER
// ============================================

/**
 * Valide la cohérence d'une configuration de campagne
 */
export function validateCampaignConfig(config: {
  objective: FacebookObjective
  optimization_goal: OptimizationGoal
  billing_event: BillingEvent
  destination_type?: DestinationType
  promoted_object?: PromotedObject
  special_ad_categories?: SpecialAdCategory[]
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifier optimization_goal compatible avec objective
  const allowedOptGoals = OBJECTIVE_TO_OPTIMIZATION_GOALS[config.objective]
  if (!allowedOptGoals.includes(config.optimization_goal)) {
    errors.push(
      `Optimization goal "${config.optimization_goal}" incompatible avec objective "${config.objective}". Autorisés: ${allowedOptGoals.join(', ')}`
    )
  }

  // Vérifier billing_event compatible
  const allowedBilling = OBJECTIVE_TO_BILLING_EVENTS[config.objective]
  if (!allowedBilling.includes(config.billing_event)) {
    errors.push(
      `Billing event "${config.billing_event}" incompatible avec objective "${config.objective}". Autorisés: ${allowedBilling.join(', ')}`
    )
  }

  // Vérifier destination_type si fourni
  if (config.destination_type) {
    const allowedDestinations = OBJECTIVE_TO_DESTINATION_TYPES[config.objective]
    if (!allowedDestinations.includes(config.destination_type)) {
      errors.push(
        `Destination type "${config.destination_type}" incompatible avec objective "${config.objective}". Autorisés: ${allowedDestinations.join(', ')}`
      )
    }
  }

  // Vérifier promoted_object requis
  const key = `${config.objective}:${config.optimization_goal}`
  const requirements = PROMOTED_OBJECT_REQUIREMENTS[key]

  if (requirements) {
    if (requirements.pixel_id === 'required' && !config.promoted_object?.pixel_id) {
      errors.push('pixel_id est requis pour cette configuration')
    }
    if (requirements.page_id === 'required' && !config.promoted_object?.page_id) {
      errors.push('page_id est requis pour cette configuration')
    }
    if (requirements.application_id === 'required' && !config.promoted_object?.application_id) {
      errors.push('application_id est requis pour cette configuration')
    }
    if (requirements.object_store_url === 'required' && !config.promoted_object?.object_store_url) {
      errors.push('object_store_url est requis pour cette configuration')
    }
    if (requirements.custom_event_type === 'required' && !config.promoted_object?.custom_event_type) {
      errors.push('custom_event_type est requis pour cette configuration')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Récupère la configuration recommandée pour un objectif donné
 */
export function getRecommendedConfig(objective: FacebookObjective): {
  optimization_goal: OptimizationGoal
  billing_event: BillingEvent
  bid_strategy: BidStrategy
  buying_type: BuyingType
} {
  return {
    optimization_goal: DEFAULT_OPTIMIZATION_GOAL[objective],
    billing_event: DEFAULT_BILLING_EVENT[objective],
    bid_strategy: DEFAULT_BID_STRATEGY,
    buying_type: DEFAULT_BUYING_TYPE,
  }
}
