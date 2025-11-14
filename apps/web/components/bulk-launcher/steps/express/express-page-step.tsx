'use client'

import { useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { trpc } from '@/lib/trpc'
import { Loader2, CheckCircle2, Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Express Mode - Step 1: Facebook Page & Instagram
 * This step ONLY asks for Facebook Page and Instagram Account
 * Client and Ad Account are already selected in pre-steps
 */
export function ExpressPageStep() {
  const { adAccountId, facebookPageId, setFacebookPageId, instagramAccountId, setInstagramAccountId } = useBulkLauncher()

  // Fetch Facebook Pages from the selected ad account
  const { data: facebookPages, isLoading: isLoadingPages } = trpc.facebookCampaigns.getUserPages.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Auto-detect Instagram account from selected Facebook Page
  const selectedPage = facebookPages?.find((page: any) => page.id === facebookPageId)
  const connectedInstagramId = selectedPage?.connected_instagram_account?.id

  // Auto-set Instagram account ID when page is selected
  useEffect(() => {
    if (connectedInstagramId && instagramAccountId !== connectedInstagramId) {
      setInstagramAccountId(connectedInstagramId)
    }
  }, [connectedInstagramId, instagramAccountId, setInstagramAccountId])

  // Auto-select first page if only one exists
  useEffect(() => {
    if (adAccountId && facebookPages && facebookPages.length === 1 && !facebookPageId) {
      setFacebookPageId(facebookPages[0].id)
    }
  }, [adAccountId, facebookPages, facebookPageId, setFacebookPageId])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Facebook Page & Instagram</h2>
        <p className="text-muted-foreground">Select your Facebook Page for this campaign</p>
      </div>

      {/* Facebook Page Selection */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Facebook className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Facebook Page *</h3>
            <p className="text-xs text-muted-foreground">Which page will run these ads?</p>
          </div>
          {facebookPageId && (
            <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
          )}
        </div>

        {isLoadingPages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : facebookPages && facebookPages.length > 0 ? (
          <div className="space-y-3">
            {facebookPages.map((page: any) => (
              <Button
                key={page.id}
                onClick={() => setFacebookPageId(page.id)}
                variant={facebookPageId === page.id ? "default" : "outline"}
                className={`w-full h-auto flex items-center gap-4 p-4 text-left justify-start ${
                  facebookPageId === page.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  facebookPageId === page.id ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Facebook className={`h-5 w-5 ${
                    facebookPageId === page.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-base font-semibold ${
                    facebookPageId === page.id ? 'text-primary' : 'text-foreground'
                  }`}>
                    {page.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {page.id}
                  </p>
                </div>
                {facebookPageId === page.id && (
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                )}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No Facebook Pages found for this account</p>
          </div>
        )}
      </div>

      {/* Instagram Account (Auto-detected) */}
      {facebookPageId && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100">
              <Instagram className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Instagram Account</h3>
              <p className="text-xs text-muted-foreground">Connected to your Facebook Page</p>
            </div>
            {instagramAccountId && (
              <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
            )}
          </div>

          {connectedInstagramId ? (
            <div className="flex items-center gap-3 px-4 py-4 rounded-lg bg-green-50 border-2 border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-base font-semibold text-green-900">
                  {selectedPage?.connected_instagram_account?.username || 'Instagram Connected'}
                </p>
                <p className="text-sm text-green-700 mt-0.5">Auto-detected from Facebook Page</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 rounded-lg bg-yellow-50 border-2 border-yellow-200">
              <div className="text-yellow-600">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">No Instagram account connected</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Stories placement will be limited to Facebook only
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Card */}
      {facebookPageId && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
          <h4 className="font-semibold text-foreground mb-3">✓ Ready to continue</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Facebook Page:</span>
              <span className="font-medium text-foreground">{selectedPage?.name}</span>
            </div>
            {connectedInstagramId && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Instagram:</span>
                <span className="font-medium text-foreground">
                  @{selectedPage?.connected_instagram_account?.username}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
