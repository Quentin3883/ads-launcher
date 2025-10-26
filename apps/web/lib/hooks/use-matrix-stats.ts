import { useMemo } from 'react'
import type { BulkAudiences, BulkCreatives } from '@/lib/types/bulk-launcher'

interface MatrixStats {
  audiences: number
  placements: number
  creatives: number
  copyVariants: number
  adSets: number
  totalAds: number
}

/**
 * Optimized hook for matrix calculations with memoization
 * Avoids expensive recalculations on every render
 */
export function useMatrixStats(
  bulkAudiences: BulkAudiences,
  bulkCreatives: BulkCreatives
): MatrixStats {
  return useMemo(() => {
    const audiencesCount = bulkAudiences.audiences.length || 0
    const placementsCount = bulkAudiences.placementPresets.length || 0
    const creativesCount = bulkCreatives.creatives.length || 0

    // Count active copy variants
    const copyVariantsCount =
      bulkCreatives.enableVariants && bulkCreatives.copyVariants
        ? bulkCreatives.copyVariants.length
        : 1

    // Calculate ad sets: audiences × placements
    const adSets = audiencesCount * placementsCount

    // Calculate total ads: ad sets × creatives × copy variants
    const totalAds = adSets * creativesCount * copyVariantsCount

    return {
      audiences: audiencesCount,
      placements: placementsCount,
      creatives: creativesCount,
      copyVariants: copyVariantsCount,
      adSets,
      totalAds,
    }
  }, [
    bulkAudiences.audiences.length,
    bulkAudiences.placementPresets.length,
    bulkCreatives.creatives.length,
    bulkCreatives.enableVariants,
    bulkCreatives.copyVariants?.length,
  ])
}

/**
 * Calculate detailed matrix breakdown for preview
 */
export function useMatrixBreakdown(bulkAudiences: BulkAudiences, bulkCreatives: BulkCreatives) {
  return useMemo(() => {
    const combinations: Array<{
      audience: string
      placement: string
      creative: string
      variant?: string
    }> = []

    bulkAudiences.audiences.forEach((audience) => {
      bulkAudiences.placementPresets.forEach((placement) => {
        bulkCreatives.creatives.forEach((creative) => {
          if (bulkCreatives.enableVariants && bulkCreatives.copyVariants) {
            bulkCreatives.copyVariants.forEach((variant) => {
              combinations.push({
                audience: audience.name,
                placement,
                creative: creative.name,
                variant: variant.name,
              })
            })
          } else {
            combinations.push({
              audience: audience.name,
              placement,
              creative: creative.name,
            })
          }
        })
      })
    })

    return combinations
  }, [
    bulkAudiences.audiences,
    bulkAudiences.placementPresets,
    bulkCreatives.creatives,
    bulkCreatives.enableVariants,
    bulkCreatives.copyVariants,
  ])
}

/**
 * Calculate estimated budget breakdown
 */
export function useBudgetBreakdown(
  budgetMode: 'CBO' | 'ABO',
  totalBudget?: number,
  budgetPerAdSet?: number,
  adSetsCount?: number
) {
  return useMemo(() => {
    if (budgetMode === 'CBO' && totalBudget) {
      return {
        mode: 'CBO' as const,
        totalBudget,
        estimatedPerAdSet: adSetsCount ? totalBudget / adSetsCount : 0,
      }
    }

    if (budgetMode === 'ABO' && budgetPerAdSet && adSetsCount) {
      return {
        mode: 'ABO' as const,
        budgetPerAdSet,
        totalBudget: budgetPerAdSet * adSetsCount,
      }
    }

    return null
  }, [budgetMode, totalBudget, budgetPerAdSet, adSetsCount])
}
