'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useClientsStore } from '@/lib/store/clients'
import { Eye, ChevronDown, ChevronRight, Loader2, Rocket } from 'lucide-react'
import { ValidationChecklist } from '../components/validation-checklist'
import { validateBulkLauncher } from '@/lib/validation/bulk-launcher'
import { useLaunchCampaign } from '@/lib/hooks/use-launch-campaign'
import { trpc } from '@/lib/trpc'
import { convertBlobUrlsToBase64 } from '@/lib/utils/blob-to-base64'
import { CampaignProgressModal } from '../campaign-progress-modal'

export function MatrixGenerationStep() {
  const store = useBulkLauncher()
  const { matrixConfig, toggleDimension, getMatrixStats, generateCampaign, generatedAdSets, facebookPageId, setFacebookPageId, instagramAccountId, setInstagramAccountId, facebookPixelId, progressSteps, showProgress, setShowProgress, setLaunchCallback } = store
  const { selectedClientId, getSelectedClient } = useClientsStore()
  const { launchCampaign, isLaunching, error: launchError } = useLaunchCampaign()
  const [showDryRun, setShowDryRun] = useState(false)
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set())
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  // Get userId for API calls
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('userId') || 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
    }
    return 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
  }, [])

  // Fetch Facebook Pages from the selected ad account (includes connected Instagram accounts)
  const { data: facebookPages, isLoading: isLoadingPages } = trpc.facebookCampaigns.getUserPages.useQuery(
    { adAccountId: store.adAccountId! },
    { enabled: !!store.adAccountId }
  )

  // Auto-detect Instagram account from selected Facebook Page
  const selectedPage = facebookPages?.find((page: any) => page.id === facebookPageId)
  const connectedInstagramId = selectedPage?.connected_instagram_account?.id

  // Auto-set Instagram account ID when page is selected (use useEffect to avoid setState during render)
  useEffect(() => {
    if (connectedInstagramId && instagramAccountId !== connectedInstagramId) {
      setInstagramAccountId(connectedInstagramId)
    }
  }, [connectedInstagramId, instagramAccountId, setInstagramAccountId])

  const stats = useMemo(() => getMatrixStats(), [getMatrixStats])
  const isOverLimit = stats.totalAds > matrixConfig.softLimit

  // Validate before launching
  const validation = validateBulkLauncher({
    clientId: store.clientId,
    campaign: store.campaign,
    bulkAudiences: store.bulkAudiences,
    bulkCreatives: store.bulkCreatives,
  })
  const canLaunch = validation.success && !isOverLimit

  const handleDryRun = useCallback(() => {
    const result = generateCampaign()
    if (result) {
      setShowDryRun(true)
    } else {
      alert('Please complete all required fields')
    }
  }, [generateCampaign])

  const handleLaunchToFacebook = useCallback(async () => {
    // First generate the campaign structure
    const result = generateCampaign()
    if (!result) {
      alert('Please complete all required fields')
      return
    }

    // Check if client is selected
    if (!store.clientId) {
      alert('Please select a client')
      return
    }

    // Check if ad account is selected
    if (!store.adAccountId) {
      alert('Please select a Facebook Ad Account')
      return
    }

    // Check if Facebook Page is selected
    if (!store.facebookPageId) {
      alert('Please select a Facebook Page')
      return
    }

    // Get user ID from URL params (set during OAuth)
    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get('userId') || 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256' // TODO: Get from auth

    setCreateSuccess(null)

    try {
      console.log('🚀 Launching campaign to Facebook...', {
        adSetsCount: result.adSets.length,
        adsCount: result.adSets.reduce((sum, as) => sum + as.ads.length, 0),
      })

      // Convert all blob URLs to base64 before sending to backend
      console.log('Converting blob URLs to base64...')
      const adSetsWithBase64 = await convertBlobUrlsToBase64(result.adSets)
      console.log('✅ Conversion complete')

      const response = await launchCampaign({
        userId,
        facebookPageId: store.facebookPageId!,
        facebookPixelId: facebookPixelId || undefined,
        instagramAccountId: store.instagramAccountId || undefined,
        generatedAdSets: adSetsWithBase64,
      })

      console.log('✅ Campaign launched successfully:', response)
      setCreateSuccess(`Campaign created on Facebook! ID: ${response.campaignId}`)

      alert(
        `✅ Success!\n\n` +
        `Campaign launched to Facebook!\n` +
        `Campaign ID: ${response.campaignId}\n` +
        `Ad Sets: ${response.results.adSets.length}\n` +
        `Ads: ${response.results.ads.length}\n` +
        (response.results.errors.length > 0 ? `\nWarnings: ${response.results.errors.length} items had errors` : '')
      )

      // Optionally reset the store after successful launch
      // store.reset()
    } catch (error: any) {
      console.error('❌ Failed to launch campaign:', error)
      alert(`❌ Error:\n\n${error.message || 'Failed to launch campaign to Facebook'}`)
    }
  }, [generateCampaign, getSelectedClient, launchCampaign, generatedAdSets, facebookPageId, facebookPixelId])

  // Keep a ref to the latest handleLaunchToFacebook
  const launchRef = useRef(handleLaunchToFacebook)
  useEffect(() => {
    launchRef.current = handleLaunchToFacebook
  }, [handleLaunchToFacebook])

  // Register a stable callback in the store that calls the latest function
  useEffect(() => {
    const stableCallback = () => launchRef.current()
    setLaunchCallback(stableCallback)
    return () => setLaunchCallback(null)
  }, [setLaunchCallback])

  const toggleAdSet = useCallback((id: string) => {
    setExpandedAdSets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Matrix Generation</h3>
        <p className="text-sm text-muted-foreground">Configure dimensions and generate campaign</p>
      </div>

      {/* Compact Stats Summary at Top */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-around gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Ad Sets</div>
            <div className="text-lg font-bold text-foreground">{stats.adSets}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Ads/Set</div>
            <div className="text-lg font-bold text-foreground">{stats.adsPerAdSet}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Total Ads</div>
            <div className={`text-lg font-bold ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
              {stats.totalAds}
            </div>
            {isOverLimit && (
              <div className="text-[10px] text-destructive mt-0.5">
                Exceeds limit ({matrixConfig.softLimit})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <ValidationChecklist />

      {/* Dimension Switches */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Dimensions to Combine</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { key: 'placements' as const, label: 'Placement Presets', description: 'Multiply Ad Sets by placements' },
            { key: 'formatSplit' as const, label: 'Format Split', description: 'Separate Image/Video' },
            { key: 'creatives' as const, label: 'Creatives', description: 'One Ad per creative' },
            { key: 'formatVariants' as const, label: 'Format Variants', description: 'Feed + Story versions' },
            { key: 'copyVariants' as const, label: 'Copy Variants', description: 'Multiply by copy' },
          ].map((dim) => (
            <label
              key={dim.key}
              className="flex items-center gap-2 p-2.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-xs"
            >
              <input
                type="checkbox"
                checked={matrixConfig.dimensions[dim.key]}
                onChange={() => toggleDimension(dim.key)}
                className="rounded border-border flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{dim.label}</div>
                <div className="text-muted-foreground text-[10px] leading-tight">{dim.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Success/Error Messages (only show if present) */}
      {createSuccess && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          ✅ {createSuccess}
        </div>
      )}
      {launchError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          ❌ {launchError}
        </div>
      )}

      {/* Dry Run Preview */}
      {showDryRun && generatedAdSets.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Dry Run Preview</h4>
            <button
              onClick={() => setShowDryRun(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {generatedAdSets.map((adSet, idx) => (
              <div key={adSet.id} className="rounded-lg border border-border bg-background">
                <button
                  onClick={() => toggleAdSet(adSet.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedAdSets.has(adSet.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Ad Set #{idx + 1}: {adSet.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {adSet.ads.length} ads • {adSet.audience.type} • {adSet.placementPreset}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {adSet.budget ? `$${adSet.budget}/${adSet.budgetType}` : 'CBO'}
                  </div>
                </button>

                {expandedAdSets.has(adSet.id) && (
                  <div className="border-t border-border bg-muted/20 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {adSet.ads.map((ad, adIdx) => (
                      <div key={ad.id} className="text-xs p-2 rounded bg-background">
                        <div className="font-medium text-foreground">
                          Ad #{adIdx + 1}: {ad.name}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {ad.format} • {ad.headline.substring(0, 30)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <CampaignProgressModal
        open={showProgress}
        steps={progressSteps}
        onClose={() => setShowProgress(false)}
      />
    </div>
  )
}
