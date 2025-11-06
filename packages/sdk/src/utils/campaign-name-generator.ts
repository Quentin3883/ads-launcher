/**
 * Campaign Name Generator
 * Génère des noms de campagne basés sur des templates et conventions de naming
 */

import type { CampaignConfig, BulkAudiencesConfig } from '../schemas/bulk-launcher.schema'

export interface NamingConventionTemplate {
  template: string
  variables?: {
    date?: {
      format?: 'MMYYYY' | 'MMDDYYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY'
    }
    location?: {
      strategy?: 'auto' | 'country' | 'city' | 'region' | 'custom'
    }
  }
}

export interface CampaignNameContext {
  clientName?: string
  subject?: string
  campaign: Partial<CampaignConfig>
  audiences?: BulkAudiencesConfig
  customVariables?: Record<string, string>
}

/**
 * Formate une date selon le format spécifié
 */
function formatDate(date: Date, format: string): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear())

  switch (format) {
    case 'MMYYYY':
      return `${month}${year}`
    case 'MMDDYYYY':
      return `${month}${day}${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    default:
      return `${month}${year}`
  }
}

/**
 * Détermine la localisation selon la stratégie
 */
function getLocation(
  audiences?: BulkAudiencesConfig,
  strategy: string = 'auto'
): string {
  if (!audiences?.geoLocations) {
    return 'N/A'
  }

  const { countries, regions, cities } = audiences.geoLocations

  // Auto : choisit automatiquement le plus spécifique
  if (strategy === 'auto') {
    if (cities && cities.length > 0) {
      // Si une seule ville, retourner son nom
      if (cities.length === 1) {
        return `city-${cities[0]}`
      }
      return `cities-${cities.length}`
    }

    if (regions && regions.length > 0) {
      if (regions.length === 1) {
        return `region-${regions[0]}`
      }
      return `regions-${regions.length}`
    }

    if (countries && countries.length > 0) {
      if (countries.length === 1 && countries[0]) {
        return countries[0]
      }
      return `countries-${countries.length}`
    }
  }

  // Stratégies spécifiques
  if (strategy === 'city' && cities && cities.length > 0) {
    return cities.length === 1 && cities[0] ? `city-${cities[0]}` : `cities-${cities.length}`
  }

  if (strategy === 'region' && regions && regions.length > 0) {
    return regions.length === 1 && regions[0] ? `region-${regions[0]}` : `regions-${regions.length}`
  }

  if (strategy === 'country' && countries && countries.length > 0) {
    return countries.length === 1 && countries[0] ? countries[0] : `countries-${countries.length}`
  }

  return 'N/A'
}

/**
 * Mappe l'objectif Facebook vers une version courte
 */
function getObjectiveShort(objective?: string): string {
  if (!objective) return 'N/A'

  const mapping: Record<string, string> = {
    OUTCOME_AWARENESS: 'AWARE',
    OUTCOME_TRAFFIC: 'TRAFFIC',
    OUTCOME_ENGAGEMENT: 'ENGAGE',
    OUTCOME_LEADS: 'LEAD',
    OUTCOME_APP_PROMOTION: 'APP',
    OUTCOME_SALES: 'SALES',
  }

  return mapping[objective] || objective
}

/**
 * Mappe le type de redirection vers une version courte
 */
function getRedirectionTypeShort(redirectionType?: string): string {
  if (!redirectionType) return 'N/A'

  const mapping: Record<string, string> = {
    LANDING_PAGE: 'LP',
    LEAD_FORM: 'LF',
    DEEPLINK: 'DL',
  }

  return mapping[redirectionType] || redirectionType
}

/**
 * Extrait un nom court depuis une URL
 */
function extractNameFromUrl(url?: string): string {
  if (!url) return 'N/A'

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Extraire le dernier segment du path
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment) {
        return lastSegment.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 30)
      }
    }

    // Sinon retourner le hostname
    const hostParts = urlObj.hostname.replace('www.', '').split('.')
    return hostParts[0] || 'N/A'
  } catch {
    return 'N/A'
  }
}

/**
 * Résout les variables du template
 */
function resolveVariables(
  template: string,
  context: CampaignNameContext,
  config?: NamingConventionTemplate['variables']
): Record<string, string> {
  const variables: Record<string, string> = {}

  // Client name
  if (template.includes('{{clientName}}')) {
    variables.clientName = context.clientName || 'Client'
  }

  // Date
  if (template.includes('{{date}}')) {
    const dateFormat = config?.date?.format || 'MMYYYY'
    const date = context.campaign.startDate
      ? new Date(context.campaign.startDate)
      : new Date()
    variables.date = formatDate(date, dateFormat)
  }

  // Subject (manuel)
  if (template.includes('{{subject}}')) {
    variables.subject = context.subject || 'Campaign'
  }

  // Location
  if (template.includes('{{location}}')) {
    const strategy = config?.location?.strategy || 'auto'
    variables.location = getLocation(context.audiences, strategy)
  }

  // Objective
  if (template.includes('{{objective}}')) {
    variables.objective = getObjectiveShort(context.campaign.objective)
  }

  // Redirection Type
  if (template.includes('{{redirectionType}}')) {
    variables.redirectionType = getRedirectionTypeShort(
      context.campaign.redirectionType
    )
  }

  // Redirection Name (extrait depuis URL)
  if (template.includes('{{redirectionName}}')) {
    variables.redirectionName = extractNameFromUrl(context.campaign.redirectionUrl)
  }

  // Campaign Type
  if (template.includes('{{type}}')) {
    variables.type = context.campaign.type || 'N/A'
  }

  // Budget
  if (template.includes('{{budget}}')) {
    variables.budget = context.campaign.budget?.toString() || 'N/A'
  }

  // Custom variables
  if (context.customVariables) {
    Object.entries(context.customVariables).forEach(([key, value]) => {
      if (template.includes(`{{${key}}}`)) {
        variables[key] = value
      }
    })
  }

  return variables
}

/**
 * Génère un nom de campagne selon un template
 */
export function generateCampaignName(
  convention: NamingConventionTemplate,
  context: CampaignNameContext
): string {
  const variables = resolveVariables(convention.template, context, convention.variables)

  let name = convention.template

  // Remplacer toutes les variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    name = name.replace(new RegExp(placeholder, 'g'), value)
  })

  // Nettoyer les variables non résolues (remplacer par N/A)
  name = name.replace(/\{\{[^}]+\}\}/g, 'N/A')

  return name
}

/**
 * Extrait les variables disponibles d'un template
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      variables.push(match[1])
    }
  }

  return [...new Set(variables)] // Dédupliquer
}

/**
 * Valide un template de naming
 */
export function validateTemplate(template: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!template || template.trim() === '') {
    errors.push('Le template ne peut pas être vide')
  }

  // Vérifier que les accolades sont bien formées
  const openBraces = (template.match(/\{\{/g) || []).length
  const closeBraces = (template.match(/\}\}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push('Les accolades du template sont mal formées')
  }

  // Vérifier qu'il n'y a pas de variables vides
  if (/\{\{\s*\}\}/.test(template)) {
    errors.push('Le template contient des variables vides')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
