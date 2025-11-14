// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
'use client'

import { useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useClientsStore } from '@/lib/store/clients'
import { trpc } from '@/lib/trpc'
import { Loader2, CheckCircle2, Facebook, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdAccountSelectionStep() {
  const { clientId, adAccountId, setAdAccountId, setFacebookPageId, setInstagramAccountId, setCurrentStep, currentStep } = useBulkLauncher()
  const { clients, selectedClientId } = useClientsStore()

  // Get client name
  const clientName = clients.find(c => c.id === clientId)?.name || 'Unknown Client'

  // Determine if client was pre-selected
  const needsClientSelection = !selectedClientId

  // Fetch ad accounts for selected client
  const { data: adAccounts, isLoading: loadingAdAccounts } = trpc.facebookCampaigns.getClientAdAccounts.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  )

  // Auto-jump to Ad Account when only 1 account exists
  useEffect(() => {
    if (clientId && adAccounts && adAccounts.length === 1 && !adAccountId) {
      setAdAccountId(adAccounts[0].id)
    }
  }, [clientId, adAccounts, adAccountId, setAdAccountId])

  const handleBack = () => {
    // Go back to previous step
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Select Facebook Ad Account</h2>
          <p className="text-muted-foreground">
            Choose which account to use for <span className="font-semibold text-foreground">{clientName}</span>
          </p>
        </div>

        {/* Previous button - only show if client was NOT pre-selected */}
        {needsClientSelection && (
          <Button
            onClick={handleBack}
            variant="ghost"
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Change client
          </Button>
        )}

        {/* Ad Account Selection */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Facebook className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Facebook Ad Account *</h3>
              <p className="text-xs text-muted-foreground">Which account to use for your campaigns</p>
            </div>
            {adAccountId && (
              <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
            )}
          </div>

          {loadingAdAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : adAccounts && adAccounts.length > 0 ? (
            <>
              {adAccounts.length === 1 && adAccountId ? (
                <div className="flex items-center gap-3 px-4 py-4 rounded-lg bg-green-50 border-2 border-green-200">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-base font-semibold text-green-900">{adAccounts[0].name}</p>
                    <p className="text-sm text-green-700 mt-0.5">Auto-selected (only account available)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {adAccounts.map((account: any) => (
                    <Button
                      key={account.id}
                      onClick={() => {
                        setAdAccountId(account.id)
                        // Reset page and instagram when changing ad account
                        setFacebookPageId(null)
                        setInstagramAccountId(null)
                      }}
                      variant="outline"
                      className={`w-full flex items-center gap-4 p-4 h-auto text-left ${
                        adAccountId === account.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        adAccountId === account.id ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Facebook className={`h-5 w-5 ${
                          adAccountId === account.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-base font-semibold ${
                          adAccountId === account.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {account.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {account.facebookId || account.id}
                        </p>
                      </div>
                      {adAccountId === account.id && (
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ad accounts found for this client</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact support to link a Facebook Ad Account
              </p>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            The Facebook Page will be selected in the next steps
          </p>
        </div>
      </div>
    </div>
  )
}
