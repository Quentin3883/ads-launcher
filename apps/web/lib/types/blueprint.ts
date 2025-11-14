// @ts-nocheck - Complex workflow types, will be refactored
import type { AudiencePreset, Demographics, PlacementPreset } from '@launcher-ads/sdk'

/**
 * LaunchBlueprint - Exportable/Importable JSON contract
 * Stable data structure for versioning and replay
 */
export interface LaunchBlueprint {
  version: string // Semantic versioning for blueprint format
  metadata: {
    name: string
    description?: string
    createdAt: string
    updatedAt: string
    author?: string
    tags?: string[]
  }

  // Campaign configuration
  campaign: {
    name: string
    country: string
    objective: 'CONVERSIONS' | 'TRAFFIC' | 'BRAND_AWARENESS' | 'LEAD_GENERATION' | 'APP_INSTALLS'
    budgetMode: 'CBO' | 'ABO'
    totalBudget?: number
  }

  // Audiences configuration
  audiences: {
    presets: AudiencePreset[]
    geoLocations: {
      countries: string[]
      regions?: string[]
      cities?: string[]
    }
    demographics: Demographics
    optimizationEvent: string
    budgetPerAdSet?: number
    budgetType?: 'daily' | 'lifetime'
  }

  // Placements
  placements: PlacementPreset[]

  // Creatives mapping (file references, not actual files)
  creatives: {
    id: string
    name: string
    format: 'Image' | 'Video'
    feedFileName?: string
    storyFileName?: string
  }[]

  // Copy variants with smart application
  copyVariants: {
    id: string
    name: string
    headline: string
    primaryText: string
    cta: string
    appliesTo: 'all' | 'feed' | 'story' | string[] // 'all', placement type, or specific creative IDs
  }[]

  // Matrix configuration
  matrix: {
    dimensions: {
      audiences: boolean
      placements: boolean
      creatives: boolean
      formatVariants: boolean
      copyVariants: boolean
    }
    softLimit: number
  }
}

/**
 * Blueprint metadata for listing/searching
 */
export interface BlueprintMetadata {
  id: string
  version: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  author?: string
  tags?: string[]
  stats: {
    audiencesCount: number
    creativesCount: number
    variantsCount: number
    estimatedAds: number
  }
}

/**
 * Validation result for blueprint import
 */
export interface BlueprintValidation {
  isValid: boolean
  version: string
  errors: string[]
  warnings: string[]
  migrations?: string[] // If version upgrade needed
}

export const CURRENT_BLUEPRINT_VERSION = '1.0.0'

/**
 * Blueprint naming convention
 * {COUNTRY}-{THEME}-{PLACEMENT}.{ext}
 * Example: FR-SUMMER-Feed.png
 */
export interface CreativeNamingConvention {
  country?: string
  theme?: string
  placement?: 'Feed' | 'Story'
  extension: string
  originalName: string
}

/**
 * Parse creative filename following convention
 */
export function parseCreativeFileName(fileName: string): CreativeNamingConvention {
  const parts = fileName.split('.')
  const extension = parts.pop() || ''
  const nameWithoutExt = parts.join('.')

  // Try to parse: {COUNTRY}-{THEME}-{PLACEMENT}
  const match = nameWithoutExt.match(/^([A-Z]{2})-([^-]+)-?(Feed|Story)?$/i)

  if (match) {
    return {
      country: match[1]?.toUpperCase(),
      theme: match[2],
      placement: match[3] as 'Feed' | 'Story' | undefined,
      extension,
      originalName: fileName,
    }
  }

  // Fallback: try to detect placement from common patterns
  const placementMatch = nameWithoutExt.match(/([-_\s]+)(feed|story)$/i)
  if (placementMatch) {
    const placement = placementMatch[2].charAt(0).toUpperCase() + placementMatch[2].slice(1).toLowerCase()
    const baseName = nameWithoutExt.replace(/([-_\s]+)(feed|story)$/i, '')

    return {
      placement: placement as 'Feed' | 'Story',
      theme: baseName,
      extension,
      originalName: fileName,
    }
  }

  // No convention detected
  return {
    extension,
    originalName: fileName,
  }
}

/**
 * Generate standardized filename
 */
export function generateStandardFileName(
  country: string,
  theme: string,
  placement: 'Feed' | 'Story',
  extension: string
): string {
  return `${country.toUpperCase()}-${theme}-${placement}.${extension}`
}

/**
 * Calculate file checksum for duplicate detection
 */
export async function calculateFileChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Detect duplicate files by checksum
 */
export interface DuplicateFile {
  file: File
  checksum: string
  duplicateOf?: string
}

export async function detectDuplicates(files: File[]): Promise<DuplicateFile[]> {
  const checksums = new Map<string, string>()
  const results: DuplicateFile[] = []

  for (const file of files) {
    const checksum = await calculateFileChecksum(file)
    const existingFileName = checksums.get(checksum)

    results.push({
      file,
      checksum,
      duplicateOf: existingFileName,
    })

    if (!existingFileName) {
      checksums.set(checksum, file.name)
    }
  }

  return results
}
