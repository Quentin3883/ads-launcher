'use client'

import { useMemo } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { validateBulkLauncher } from '@/lib/validation/bulk-launcher'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useMatrixStats } from '@/lib/hooks/use-matrix-stats'

export function ValidationChecklist() {
  const store = useBulkLauncher()
  const stats = useMatrixStats(store.bulkAudiences, store.bulkCreatives)

  const validation = useMemo(() => {
    const result = validateBulkLauncher({
      clientId: store.clientId,
      campaign: store.campaign,
      bulkAudiences: store.bulkAudiences,
      bulkCreatives: store.bulkCreatives,
    })

    return result
  }, [store.clientId, store.campaign, store.bulkAudiences, store.bulkCreatives])

  const checks = useMemo(() => {
    const items = []

    // Campaign checks
    items.push({
      id: 'campaign-name',
      label: 'Campaign name is set',
      status: store.campaign.name.length > 0 ? 'success' : 'error',
      message: store.campaign.name.length > 0 ? store.campaign.name : 'Campaign name is required',
    })

    items.push({
      id: 'campaign-country',
      label: 'Target country selected',
      status: store.campaign.country ? 'success' : 'error',
      message: store.campaign.country || 'Country is required',
    })

    // Budget checks
    if (store.campaign.budgetMode === 'CBO') {
      items.push({
        id: 'budget-cbo',
        label: 'Total budget (CBO)',
        status: store.campaign.totalBudget && store.campaign.totalBudget >= 50 ? 'success' : 'error',
        message:
          store.campaign.totalBudget && store.campaign.totalBudget >= 50
            ? `$${store.campaign.totalBudget}`
            : 'Minimum $50 required',
      })
    } else {
      items.push({
        id: 'budget-abo',
        label: 'Budget per ad set (ABO)',
        status:
          store.bulkAudiences.budgetPerAdSet && store.bulkAudiences.budgetPerAdSet >= 5
            ? 'success'
            : 'error',
        message:
          store.bulkAudiences.budgetPerAdSet && store.bulkAudiences.budgetPerAdSet >= 5
            ? `$${store.bulkAudiences.budgetPerAdSet}/ad set`
            : 'Minimum $5 per ad set',
      })
    }

    // Audience checks
    items.push({
      id: 'audiences',
      label: 'Audiences configured',
      status: stats.audiences > 0 ? 'success' : 'error',
      message: stats.audiences > 0 ? `${stats.audiences} audiences` : 'At least 1 audience required',
    })

    items.push({
      id: 'placements',
      label: 'Placement presets selected',
      status: stats.placements > 0 ? 'success' : 'error',
      message:
        stats.placements > 0 ? `${stats.placements} presets` : 'At least 1 placement required',
    })

    items.push({
      id: 'geo',
      label: 'Geo locations set',
      status: store.bulkAudiences.geoLocations.countries.length > 0 ? 'success' : 'error',
      message:
        store.bulkAudiences.geoLocations.countries.length > 0
          ? store.bulkAudiences.geoLocations.countries.join(', ')
          : 'At least 1 country required',
    })

    // Creative checks
    items.push({
      id: 'creatives',
      label: 'Creatives uploaded',
      status: stats.creatives > 0 ? 'success' : 'error',
      message: stats.creatives > 0 ? `${stats.creatives} creatives` : 'At least 1 creative required',
    })

    const creativesWithVersions = store.bulkCreatives.creatives.filter(
      (c) => c.feedVersion || c.storyVersion
    )
    items.push({
      id: 'creative-versions',
      label: 'All creatives have versions',
      status: creativesWithVersions.length === store.bulkCreatives.creatives.length ? 'success' : 'error',
      message:
        creativesWithVersions.length === store.bulkCreatives.creatives.length
          ? 'All creatives ready'
          : `${store.bulkCreatives.creatives.length - creativesWithVersions.length} missing versions`,
    })

    // Placement validation: Story-only requires portrait creatives
    const hasStoryOnly = store.bulkAudiences.placementPresets.includes('STORIES_ONLY')
    if (hasStoryOnly) {
      const creativesWithStory = store.bulkCreatives.creatives.filter((c) => c.storyVersion)
      items.push({
        id: 'story-placement-validation',
        label: 'Story placement requires portrait creatives',
        status: creativesWithStory.length > 0 ? 'success' : 'error',
        message:
          creativesWithStory.length > 0
            ? `${creativesWithStory.length} story creatives available`
            : 'STORIES_ONLY placement requires portrait/story format creatives',
      })
    }

    // Copy checks
    if (store.bulkCreatives.sameCopyForAll) {
      items.push({
        id: 'copy',
        label: 'Ad copy configured',
        status:
          store.bulkCreatives.globalHeadline && store.bulkCreatives.globalPrimaryText
            ? 'success'
            : 'warning',
        message:
          store.bulkCreatives.globalHeadline && store.bulkCreatives.globalPrimaryText
            ? 'Global copy set'
            : 'Copy is optional but recommended',
      })
    }

    if (store.bulkCreatives.enableVariants) {
      items.push({
        id: 'variants',
        label: 'Copy variants ready',
        status:
          store.bulkCreatives.copyVariants && store.bulkCreatives.copyVariants.length > 0
            ? 'success'
            : 'error',
        message:
          store.bulkCreatives.copyVariants && store.bulkCreatives.copyVariants.length > 0
            ? `${store.bulkCreatives.copyVariants.length} variants`
            : 'At least 1 variant required when enabled',
      })
    }

    return items
  }, [store, stats])

  const hasErrors = checks.some((check) => check.status === 'error')
  const hasWarnings = checks.some((check) => check.status === 'warning')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Pre-Launch Checklist</h3>
        {!hasErrors && !hasWarnings && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Ready to launch
          </div>
        )}
        {hasErrors && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            {checks.filter((c) => c.status === 'error').length} errors
          </div>
        )}
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              check.status === 'success'
                ? 'border-green-200 bg-green-50'
                : check.status === 'warning'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-red-200 bg-red-50'
            }`}
          >
            {check.status === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            {check.status === 'warning' && (
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            {check.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-medium ${
                  check.status === 'success'
                    ? 'text-green-900'
                    : check.status === 'warning'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                }`}
              >
                {check.label}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  check.status === 'success'
                    ? 'text-green-700'
                    : check.status === 'warning'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                }`}
              >
                {check.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!validation.success && (
        <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-900 mb-2">Validation Errors:</div>
          <ul className="space-y-1">
            {validation.formattedErrors.map((error, i) => (
              <li key={i} className="text-xs text-red-700">
                • {error.path}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
