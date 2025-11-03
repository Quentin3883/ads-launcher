'use client'

import { useEffect, useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useClientsStore } from '@/lib/store/clients'
import { trpc } from '@/lib/trpc'
import { Loader2, CheckCircle2, Building2, Facebook, Instagram } from 'lucide-react'

export function ExpressClientStep() {
  const { clientId, setClientId, adAccountId, setAdAccountId, facebookPageId, setFacebookPageId, instagramAccountId, setInstagramAccountId } = useBulkLauncher()
  const { clients } = useClientsStore()

  // Fetch ad accounts for selected client
  const { data: adAccounts, isLoading: loadingAdAccounts } = trpc.clients.getAdAccounts.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  )

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

  // Auto-jump to Ad Account when client selected and only 1 account exists
  useEffect(() => {
    if (clientId && adAccounts && adAccounts.length === 1 && !adAccountId) {
      setAdAccountId(adAccounts[0].id)
    }
  }, [clientId, adAccounts, adAccountId, setAdAccountId])

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
        <h2 className="text-2xl font-bold text-foreground">Setup Your Accounts</h2>
        <p className="text-muted-foreground">Select your client and Facebook account</p>
      </div>

      {/* Client Selection */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Client *</h3>
            <p className="text-xs text-muted-foreground">Who is this campaign for?</p>
          </div>
        </div>

        <select
          value={clientId || ''}
          onChange={(e) => {
            setClientId(e.target.value)
            setAdAccountId(null) // Reset ad account when client changes
            setFacebookPageId(null)
            setInstagramAccountId(null)
          }}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ad Account Selection */}
      {clientId && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Facebook Ad Account *</h3>
              <p className="text-xs text-muted-foreground">Which account to use for ads</p>
            </div>
            {adAccountId && (
              <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
            )}
          </div>

          {loadingAdAccounts ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : adAccounts && adAccounts.length > 0 ? (
            <>
              {adAccounts.length === 1 && adAccountId ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{adAccounts[0].name}</p>
                    <p className="text-xs text-green-700">Auto-selected (only account)</p>
                  </div>
                </div>
              ) : (
                <select
                  value={adAccountId || ''}
                  onChange={(e) => {
                    setAdAccountId(e.target.value)
                    setFacebookPageId(null)
                    setInstagramAccountId(null)
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select ad account...</option>
                  {adAccounts.map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No ad accounts found for this client
            </div>
          )}
        </div>
      )}

      {/* Facebook Page Selection */}
      {adAccountId && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Facebook Page *</h3>
              <p className="text-xs text-muted-foreground">Page that will publish the ads</p>
            </div>
            {facebookPageId && (
              <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
            )}
          </div>

          {isLoadingPages ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : facebookPages && facebookPages.length > 0 ? (
            <>
              {facebookPages.length === 1 && facebookPageId ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{facebookPages[0].name}</p>
                    <p className="text-xs text-green-700">Auto-selected (only page)</p>
                  </div>
                </div>
              ) : (
                <select
                  value={facebookPageId || ''}
                  onChange={(e) => setFacebookPageId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="" disabled>Choose a page...</option>
                  {facebookPages.map((page: any) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No pages found
            </div>
          )}
        </div>
      )}

      {/* Instagram Account (Auto-detected) */}
      {connectedInstagramId && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Instagram Account Connected</h3>
              <p className="text-xs text-green-700">Auto-detected from Facebook Page</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/50 border border-green-200">
            <p className="text-sm font-mono text-green-900">ID: {connectedInstagramId}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {clientId && adAccountId && facebookPageId && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-foreground">Ready to Continue</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium text-foreground">
                {clients.find(c => c.id === clientId)?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ad Account:</span>
              <span className="font-medium text-foreground">
                {adAccounts?.find((a: any) => a.id === adAccountId)?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Facebook Page:</span>
              <span className="font-medium text-foreground">
                {facebookPages?.find((p: any) => p.id === facebookPageId)?.name}
              </span>
            </div>
            {connectedInstagramId && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Instagram:</span>
                <span className="font-medium text-green-600">✓ Connected</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
