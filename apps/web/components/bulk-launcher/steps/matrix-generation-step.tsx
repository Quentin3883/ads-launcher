'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
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
  const { matrixConfig, toggleDimension, getMatrixStats, generateCampaign, generatedAdSets, facebookPageId, setFacebookPageId, instagramAccountId, setInstagramAccountId, progressSteps, showProgress, setShowProgress } = store
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

  const [facebookPixelId] = useState('') // Optional

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

      {/* Validation Checklist */}
      <ValidationChecklist />

      {/* Facebook Page Selection */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Facebook Page *</h4>
        <p className="text-sm text-muted-foreground">Select or enter a Facebook Page ID for your ads</p>

        {isLoadingPages ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pages...
          </div>
        ) : facebookPages && facebookPages.length > 0 ? (
          <select
            value={facebookPageId || ''}
            onChange={(e) => setFacebookPageId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">Select a Facebook Page...</option>
            {facebookPages.map((page: any) => (
              <option key={page.id} value={page.id}>
                {page.name} (ID: {page.id})
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              No Facebook Pages found in your account. Enter a Page ID manually:
            </div>
            <input
              type="text"
              value={facebookPageId || ''}
              onChange={(e) => setFacebookPageId(e.target.value)}
              placeholder="Enter Facebook Page ID (e.g., 397742766762941)"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        )}
      </div>

      {/* Instagram Account - Auto-detected */}
      {connectedInstagramId && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h4 className="font-semibold text-foreground">Instagram Account</h4>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Instagram account connected</p>
              <p className="text-xs text-green-700 mt-0.5">ID: {connectedInstagramId}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            ℹ️ Automatically detected from selected Facebook Page
          </p>
        </div>
      )}

      {/* Instagram Account - Manual Input (if no connected account) */}
      {!connectedInstagramId && facebookPageId && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h4 className="font-semibold text-foreground">Instagram Account (Optional)</h4>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">No Instagram account connected to this page</p>
              <p className="text-xs text-yellow-700 mt-0.5">Enter an Instagram Account ID manually if needed for Instagram placements</p>
            </div>
          </div>
          <input
            type="text"
            value={instagramAccountId || ''}
            onChange={(e) => setInstagramAccountId(e.target.value)}
            placeholder="Enter Instagram Account ID (e.g., 17841400605492769)"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      )}

      {/* Dimension Switches */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Dimensions to Combine</h4>

        <div className="space-y-3">
          {[
            { key: 'audiences' as const, label: 'Audiences', description: 'Create one Ad Set per audience' },
            { key: 'placements' as const, label: 'Placement Presets', description: 'Multiply Ad Sets by placements' },
            { key: 'creatives' as const, label: 'Creatives', description: 'Create one Ad per creative' },
            { key: 'formatVariants' as const, label: 'Format Variants (Feed/Story)', description: 'Create Feed + Story version per creative' },
            { key: 'copyVariants' as const, label: 'Copy Variants', description: 'Multiply Ads by copy variants' },
          ].map((dim) => (
            <label
              key={dim.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={matrixConfig.dimensions[dim.key]}
                  onChange={() => toggleDimension(dim.key)}
                  className="rounded border-border"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{dim.label}</div>
                  <div className="text-xs text-muted-foreground">{dim.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ad Sets</div>
            <div className="text-3xl font-bold text-foreground">{stats.adSets}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ads per Ad Set</div>
            <div className="text-3xl font-bold text-foreground">{stats.adsPerAdSet}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Ads</div>
            <div className={`text-3xl font-bold ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
              {stats.totalAds}
            </div>
            {isOverLimit && (
              <div className="text-xs text-destructive mt-1">
                ⚠️ Exceeds soft limit ({matrixConfig.softLimit})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDryRun}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors font-semibold"
          >
            <Eye className="h-5 w-5" />
            Dry Run (Preview)
          </button>
          <button
            onClick={handleLaunchToFacebook}
            disabled={!canLaunch || isLaunching}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              !canLaunch || isLaunching
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
            }`}
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Launching to Facebook...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                🚀 Launch to Facebook
              </>
            )}
          </button>
          {!canLaunch && (
            <p className="text-xs text-muted-foreground">
              {!validation.success ? 'Fix validation errors to launch' : 'Exceeds soft limit'}
            </p>
          )}
        </div>

        {/* Success/Error Messages */}
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
      </div>

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
