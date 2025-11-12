/**
 * Dynamic parameter replacement utilities
 * Supports: {{city}}, {{label}}, {{country}}, {{placement}}, {{audience}}
 */

export interface DynamicParams {
  city?: string
  label?: string
  country?: string
  placement?: string
  audience?: string
  [key: string]: string | undefined
}

/**
 * Replace dynamic parameters in text with actual values
 * @param text - Text containing {{param}} placeholders
 * @param params - Object with parameter values
 * @returns Text with parameters replaced
 */
export function replaceDynamicParams(text: string, params: DynamicParams): string {
  let result = text

  // Replace each parameter
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      // Match {{key}} or {{ key }} (with optional spaces)
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
      result = result.replace(regex, value)
    }
  })

  return result
}

/**
 * Check if text contains dynamic parameters
 */
export function hasDynamicParams(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text)
}

/**
 * Extract all dynamic parameters from text
 * @returns Array of parameter names found
 */
export function extractDynamicParams(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g)
  if (!matches) return []

  return matches.map(match => {
    // Remove {{ }} and trim
    return match.replace(/^\{\{|\}\}$/g, '').trim()
  })
}

/**
 * Get preview text with example values for common parameters
 */
export function getPreviewText(text: string): string {
  const exampleParams: DynamicParams = {
    city: 'Paris',
    label: 'Premium',
    country: 'France',
    placement: 'Feed',
    audience: 'Broad Audience',
  }

  return replaceDynamicParams(text, exampleParams)
}
