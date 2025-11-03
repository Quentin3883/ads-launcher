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

    // Essential checks only
    items.push({
      id: 'campaign-name',
      label: 'Campaign name',
      status: store.campaign.name && store.campaign.name.length > 0 ? 'success' : 'error',
      message: store.campaign.name || 'Required',
    })

    // Budget check
    if (store.campaign.budgetMode === 'CBO') {
      items.push({
        id: 'budget',
        label: 'Budget',
        status: store.campaign.budget && store.campaign.budget >= 50 ? 'success' : 'error',
        message: store.campaign.budget ? `$${store.campaign.budget}` : 'Min $50',
      })
    }

    // Audiences
    items.push({
      id: 'audiences',
      label: 'Audiences',
      status: stats.audiences > 0 ? 'success' : 'error',
      message: stats.audiences > 0 ? `${stats.audiences}` : 'Required',
    })

    // Creatives
    const creativesWithVersions = store.bulkCreatives.creatives.filter(
      (c) => c.feedVersion || c.storyVersion
    )
    items.push({
      id: 'creatives',
      label: 'Creatives',
      status: creativesWithVersions.length > 0 ? 'success' : 'error',
      message: creativesWithVersions.length > 0 ? `${creativesWithVersions.length}` : 'Required',
    })

    // Copy
    items.push({
      id: 'copy',
      label: 'Ad copy',
      status:
        store.bulkCreatives.globalHeadline && store.bulkCreatives.globalPrimaryText
          ? 'success'
          : 'warning',
      message:
        store.bulkCreatives.globalHeadline && store.bulkCreatives.globalPrimaryText
          ? 'Ready'
          : 'Recommended',
    })

    return items
  }, [store, stats])

  const hasErrors = checks.some((check) => check.status === 'error')
  const hasWarnings = checks.some((check) => check.status === 'warning')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pre-Launch Checklist</h3>
        {!hasErrors && !hasWarnings && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready
          </div>
        )}
        {hasErrors && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <XCircle className="h-3.5 w-3.5" />
            {checks.filter((c) => c.status === 'error').length} errors
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs border border-border/50"
          >
            {check.status === 'success' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            )}
            {check.status === 'warning' && (
              <AlertCircle className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
            )}
            {check.status === 'error' && (
              <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span
                className={`font-medium ${
                  check.status === 'success'
                    ? 'text-foreground'
                    : check.status === 'warning'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                }`}
              >
                {check.label}
              </span>
              <span
                className={`ml-1 ${
                  check.status === 'success'
                    ? 'text-muted-foreground'
                    : check.status === 'warning'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                · {check.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
