import type { LaunchBlueprint, BlueprintValidation, BlueprintMetadata } from '@/lib/types/blueprint'
import { CURRENT_BLUEPRINT_VERSION } from '@/lib/types/blueprint'
import type { BulkLauncherState } from '@/lib/store/bulk-launcher'

/**
 * Export current campaign state as Blueprint JSON
 */
export function exportBlueprint(
  state: BulkLauncherState,
  metadata: Partial<LaunchBlueprint['metadata']> = {}
): LaunchBlueprint {
  const now = new Date().toISOString()

  const blueprint: LaunchBlueprint = {
    version: CURRENT_BLUEPRINT_VERSION,
    metadata: {
      name: metadata.name || state.campaign.name || 'Untitled Blueprint',
      description: metadata.description,
      createdAt: metadata.createdAt || now,
      updatedAt: now,
      author: metadata.author,
      tags: metadata.tags || [],
    },
    campaign: {
      name: state.campaign.name,
      country: state.campaign.country,
      objective: state.campaign.objective,
      budgetMode: state.campaign.budgetMode,
      totalBudget: state.campaign.totalBudget,
    },
    audiences: {
      presets: state.bulkAudiences.audiences,
      geoLocations: state.bulkAudiences.geoLocations,
      demographics: state.bulkAudiences.demographics,
      optimizationEvent: state.bulkAudiences.optimizationEvent,
      budgetPerAdSet: state.bulkAudiences.budgetPerAdSet,
      budgetType: state.bulkAudiences.budgetType,
    },
    placements: state.bulkAudiences.placementPresets,
    creatives: state.bulkCreatives.creatives.map((creative) => ({
      id: creative.id,
      name: creative.name,
      format: creative.format,
      feedFileName: creative.feedVersion?.file.name,
      storyFileName: creative.storyVersion?.file.name,
    })),
    copyVariants: (state.bulkCreatives.copyVariants || []).map((variant) => ({
      ...variant,
      appliesTo: 'all', // Default for now, will be enhanced
    })),
    matrix: state.matrixConfig,
  }

  return blueprint
}

/**
 * Download blueprint as JSON file
 */
export function downloadBlueprint(blueprint: LaunchBlueprint, fileName?: string): void {
  const json = JSON.stringify(blueprint, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName || `${blueprint.metadata.name.replace(/\s+/g, '-')}-blueprint.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Validate blueprint structure and version
 */
export function validateBlueprint(data: unknown): BlueprintValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const migrations: string[] = []

  // Type guard
  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      version: 'unknown',
      errors: ['Blueprint must be a valid JSON object'],
      warnings: [],
    }
  }

  const blueprint = data as Partial<LaunchBlueprint>

  // Check version
  if (!blueprint.version) {
    errors.push('Missing blueprint version')
  } else if (blueprint.version !== CURRENT_BLUEPRINT_VERSION) {
    warnings.push(`Blueprint version ${blueprint.version} may need migration to ${CURRENT_BLUEPRINT_VERSION}`)
    migrations.push(`Upgrade from ${blueprint.version} to ${CURRENT_BLUEPRINT_VERSION}`)
  }

  // Check required fields
  if (!blueprint.metadata) errors.push('Missing metadata')
  if (!blueprint.campaign) errors.push('Missing campaign configuration')
  if (!blueprint.audiences) errors.push('Missing audiences configuration')
  if (!blueprint.placements) errors.push('Missing placements configuration')
  if (!blueprint.creatives) errors.push('Missing creatives configuration')

  // Validate campaign
  if (blueprint.campaign) {
    if (!blueprint.campaign.name) errors.push('Campaign name is required')
    if (!blueprint.campaign.country) errors.push('Campaign country is required')
    if (!blueprint.campaign.objective) errors.push('Campaign objective is required')
    if (!blueprint.campaign.budgetMode) errors.push('Campaign budget mode is required')

    if (blueprint.campaign.budgetMode === 'CBO' && !blueprint.campaign.totalBudget) {
      errors.push('Total budget is required for CBO campaigns')
    }
  }

  // Validate audiences
  if (blueprint.audiences) {
    if (!blueprint.audiences.presets || blueprint.audiences.presets.length === 0) {
      errors.push('At least one audience preset is required')
    }
    if (!blueprint.audiences.geoLocations?.countries || blueprint.audiences.geoLocations.countries.length === 0) {
      errors.push('At least one country is required')
    }
  }

  // Validate placements
  if (!blueprint.placements || blueprint.placements.length === 0) {
    errors.push('At least one placement is required')
  }

  // Validate creatives
  if (!blueprint.creatives || blueprint.creatives.length === 0) {
    errors.push('At least one creative is required')
  } else {
    blueprint.creatives.forEach((creative, idx) => {
      if (!creative.feedFileName && !creative.storyFileName) {
        warnings.push(`Creative #${idx + 1} (${creative.name}) has no file references`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    version: blueprint.version || 'unknown',
    errors,
    warnings,
    migrations,
  }
}

/**
 * Import blueprint and merge with current state (partial application)
 */
export function importBlueprint(blueprint: LaunchBlueprint): Partial<BulkLauncherState> {
  return {
    campaign: blueprint.campaign,
    bulkAudiences: {
      audiences: blueprint.audiences.presets,
      geoLocations: blueprint.audiences.geoLocations,
      demographics: blueprint.audiences.demographics,
      optimizationEvent: blueprint.audiences.optimizationEvent,
      budgetPerAdSet: blueprint.audiences.budgetPerAdSet,
      budgetType: blueprint.audiences.budgetType,
      placementPresets: blueprint.placements,
    },
    // Note: Creatives cannot be imported without actual files
    // They need to be re-uploaded by the user
    matrixConfig: blueprint.matrix,
  }
}

/**
 * Extract blueprint metadata for listing/preview
 */
export function extractBlueprintMetadata(blueprint: LaunchBlueprint): BlueprintMetadata {
  const audiencesCount = blueprint.audiences.presets.length
  const creativesCount = blueprint.creatives.length
  const variantsCount = blueprint.copyVariants?.length || 1

  // Estimate total ads
  const placementsCount = blueprint.placements.length
  const formatVariantsCount = blueprint.matrix.dimensions.formatVariants ? 2 : 1
  const estimatedAds = audiencesCount * placementsCount * creativesCount * formatVariantsCount * variantsCount

  return {
    id: `${blueprint.metadata.name}-${blueprint.metadata.createdAt}`,
    version: blueprint.version,
    name: blueprint.metadata.name,
    description: blueprint.metadata.description,
    createdAt: blueprint.metadata.createdAt,
    updatedAt: blueprint.metadata.updatedAt,
    author: blueprint.metadata.author,
    tags: blueprint.metadata.tags,
    stats: {
      audiencesCount,
      creativesCount,
      variantsCount,
      estimatedAds,
    },
  }
}

/**
 * Read blueprint from uploaded file
 */
export async function readBlueprintFile(file: File): Promise<LaunchBlueprint> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const blueprint = JSON.parse(json) as LaunchBlueprint
        resolve(blueprint)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
