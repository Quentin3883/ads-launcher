import { Blueprint } from '@launcher-ads/sdk'
import { ProviderAdapter } from '../providers'
import {
  LaunchResult,
  LaunchOptions,
  CreatedEntity,
} from './types'
import { expandBlueprint, createCreativeVariant } from './expand-blueprint'

/**
 * Lance un blueprint et crée toutes les entités publicitaires
 *
 * Processus:
 * 1. Expanse le blueprint en paramètres
 * 2. Crée les campagnes (1 par value prop)
 * 3. Pour chaque campagne, crée les adsets (1 par audience)
 * 4. Pour chaque adset, crée les ads
 * 5. Retourne le résultat complet avec tous les IDs
 *
 * @param blueprint - Blueprint à lancer
 * @param adapter - Adapter de la plateforme
 * @param options - Options du launch
 * @returns Résultat du launch avec tous les IDs créés
 *
 * @example
 * ```typescript
 * const adapter = new MetaAdapter({ accessToken: 'xxx' })
 * const result = await runLaunch(blueprint, adapter, { dryRun: false })
 * console.log(result.created.length) // 10 (campaigns + adsets + ads)
 * ```
 */
export async function runLaunch(
  blueprint: Blueprint,
  adapter: ProviderAdapter,
  options: LaunchOptions = {}
): Promise<LaunchResult> {
  const startedAt = new Date()
  const created: CreatedEntity[] = []
  const errors: Array<{ entity: string; error: string }> = []

  console.log(`[LaunchRunner] Starting launch for blueprint: ${blueprint.name}`)
  console.log(`[LaunchRunner] Platform: ${blueprint.platform}`)
  console.log(`[LaunchRunner] Dry run: ${options.dryRun || false}`)

  try {
    // 1. Vérifier l'authentification
    await adapter.ensureAuth('org-default', 'connection-default')

    // 2. Expanser le blueprint
    const params = expandBlueprint(blueprint.config)

    console.log(
      `[LaunchRunner] Expansion: ${params.valueProps?.length || 1} value props x ${params.audiences?.length || 1} audiences`
    )

    // 3. Créer les campagnes (1 par value prop)
    const valueProps = params.valueProps || [params.creative.headline]

    for (const [vpIndex, valueProp] of valueProps.entries()) {
      const campaignName = `${blueprint.name} - ${valueProp}`
      try {
        // Créer la campagne
        console.log(`[LaunchRunner] Creating campaign: ${campaignName}`)

        const campaignResult = await adapter.createCampaign({
          name: campaignName,
          objective: 'CONVERSIONS',
          status: 'PAUSED', // Démarrer en pause pour review
          budget: params.budget,
        })

        created.push({
          type: 'campaign',
          externalId: campaignResult.id,
          name: campaignName,
          metadata: { valueProp, index: vpIndex },
        })

        console.log(`[LaunchRunner] ✓ Campaign created: ${campaignResult.id}`)

        // 4. Pour chaque audience, créer un adset
        const audiences = params.audiences || []

        for (const [audIndex, audience] of audiences.entries()) {
          const adsetName = `${campaignName} - ${audience.name}`
          try {
            console.log(`[LaunchRunner] Creating adset: ${adsetName}`)

            const adsetResult = await adapter.createAdSet({
              campaignId: campaignResult.id,
              name: adsetName,
              status: 'PAUSED',
              targeting: {
                ageMin: audience.ageMin,
                ageMax: audience.ageMax,
                locations: audience.locations,
                interests: audience.interests,
              },
              budget: params.budget,
            })

            created.push({
              type: 'adset',
              externalId: adsetResult.id,
              name: adsetName,
              parentId: campaignResult.id,
              metadata: { audience: audience.name, index: audIndex },
            })

            console.log(`[LaunchRunner] ✓ AdSet created: ${adsetResult.id}`)

            // 5. Créer l'ad pour cet adset
            const adName = `${adsetName} - Ad`
            try {
              const creativeVariant = createCreativeVariant(
                params.creative,
                valueProp
              )

              console.log(`[LaunchRunner] Creating ad: ${adName}`)

              const adResult = await adapter.createAd({
                adSetId: adsetResult.id,
                name: adName,
                status: 'PAUSED',
                creative: {
                  title: creativeVariant.headline,
                  body: creativeVariant.description,
                  imageUrl: creativeVariant.imageUrl,
                  callToAction: creativeVariant.callToAction,
                },
              })

              created.push({
                type: 'ad',
                externalId: adResult.id,
                name: adName,
                parentId: adsetResult.id,
                metadata: { valueProp },
              })

              console.log(`[LaunchRunner] ✓ Ad created: ${adResult.id}`)
            } catch (adError) {
              const errorMsg =
                adError instanceof Error ? adError.message : String(adError)
              console.error(`[LaunchRunner] ✗ Ad creation failed: ${errorMsg}`)
              errors.push({ entity: adName, error: errorMsg })
            }
          } catch (adsetError) {
            const errorMsg =
              adsetError instanceof Error
                ? adsetError.message
                : String(adsetError)
            console.error(
              `[LaunchRunner] ✗ AdSet creation failed: ${errorMsg}`
            )
            errors.push({ entity: adsetName, error: errorMsg })
          }
        }
      } catch (campaignError) {
        const errorMsg =
          campaignError instanceof Error
            ? campaignError.message
            : String(campaignError)
        console.error(
          `[LaunchRunner] ✗ Campaign creation failed: ${errorMsg}`
        )
        errors.push({ entity: campaignName, error: errorMsg })
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[LaunchRunner] ✗ Launch failed: ${errorMsg}`)
    throw new Error(`Launch failed: ${errorMsg}`)
  }

  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()

  // Calculer les totaux
  const totalCreated = {
    campaigns: created.filter((e) => e.type === 'campaign').length,
    adsets: created.filter((e) => e.type === 'adset').length,
    ads: created.filter((e) => e.type === 'ad').length,
  }

  console.log(
    `[LaunchRunner] Launch completed in ${durationMs}ms: ${totalCreated.campaigns} campaigns, ${totalCreated.adsets} adsets, ${totalCreated.ads} ads`
  )

  if (errors.length > 0) {
    console.warn(`[LaunchRunner] ⚠️  ${errors.length} errors occurred`)
  }

  const result: LaunchResult = {
    blueprintId: blueprint.id,
    blueprintName: blueprint.name,
    platform: blueprint.platform,
    created,
    totalCreated,
    startedAt,
    completedAt,
    durationMs,
    errors,
  }

  return result
}

/**
 * Valide qu'un blueprint peut être lancé
 *
 * @param blueprint - Blueprint à valider
 * @throws {Error} Si le blueprint est invalide
 */
export function validateBlueprint(blueprint: Blueprint): void {
  if (!blueprint.name) {
    throw new Error('Blueprint must have a name')
  }

  if (!blueprint.platform) {
    throw new Error('Blueprint must have a platform')
  }

  if (!blueprint.config) {
    throw new Error('Blueprint must have a config')
  }

  if (!blueprint.config.budget || blueprint.config.budget <= 0) {
    throw new Error('Blueprint must have a valid budget')
  }

  if (
    !blueprint.config.creative ||
    !blueprint.config.creative.headline ||
    !blueprint.config.creative.description
  ) {
    throw new Error('Blueprint must have valid creative')
  }

  if (
    !blueprint.config.targetAudience ||
    !blueprint.config.targetAudience.locations ||
    blueprint.config.targetAudience.locations.length === 0
  ) {
    throw new Error('Blueprint must have at least one target location')
  }
}
