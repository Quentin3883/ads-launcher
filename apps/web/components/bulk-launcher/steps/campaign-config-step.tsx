'use client'

import { useState, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { COUNTRIES } from '@launcher-ads/sdk'
import type { CampaignType, RedirectionType, BudgetMode } from '@launcher-ads/sdk'
import { Settings, Loader2, CheckCircle2, Facebook, Instagram } from 'lucide-react'
import { UrlParamsModal } from '../url-params-modal'
import { trpc } from '@/lib/trpc'

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Traffic', label: 'Traffic' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Leads', label: 'Leads' },
  { value: 'AppPromotion', label: 'App Promotion' },
  { value: 'Sales', label: 'Sales' },
]

export function CampaignConfigStep() {
  const { campaign, updateCampaign, bulkAudiences, getMatrixStats, adAccountId, facebookPageId, setFacebookPageId, instagramAccountId, setInstagramAccountId } = useBulkLauncher()
  const stats = getMatrixStats()
  const [showUrlParamsModal, setShowUrlParamsModal] = useState(false)
  const [showPageDropdown, setShowPageDropdown] = useState(false)

  // Fetch Facebook Pages from the selected ad account
  const { data: facebookPages, isLoading: isLoadingPages } = trpc.facebookCampaigns.getUserPages.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Debug: log pages data
  useEffect(() => {
    if (facebookPages) {
      console.log('📄 Facebook Pages:', facebookPages)
    }
  }, [facebookPages])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPageDropdown) {
        setShowPageDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showPageDropdown])

  // Calculate ABO budget sum
  const aboTotalBudget = campaign.budgetMode === 'ABO'
    ? stats.adSets * (bulkAudiences.budgetPerAdSet || 0)
    : 0
  const showAboWarning = campaign.budgetMode === 'ABO' && campaign.budget && aboTotalBudget > campaign.budget

  const handleRedirectionTypeChange = (type: RedirectionType) => {
    updateCampaign({
      redirectionType: type,
      redirectionUrl: type === 'LANDING_PAGE' ? campaign.redirectionUrl : undefined,
      redirectionFormId: type === 'LEAD_FORM' ? campaign.redirectionFormId : undefined,
      redirectionDeeplink: type === 'DEEPLINK' ? campaign.redirectionDeeplink : undefined,
    })
  }

  // Auto-add https:// if missing
  const handleUrlBlur = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      updateCampaign({ redirectionUrl: `https://${url}` })
    }
  }

  return (
    <div className="space-y-6">
      {/* Facebook Page & Instagram - 2 Columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Facebook Page Selection */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <Facebook className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Facebook Page *</h4>
              <p className="text-xs text-muted-foreground truncate">Sélectionnez la page Facebook</p>
            </div>
            {facebookPageId && (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
          </div>

        {isLoadingPages ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : facebookPages && facebookPages.length > 0 ? (
          <div className="relative">
            {/* Selected Page Display */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowPageDropdown(!showPageDropdown)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left"
            >
              {selectedPage ? (
                <>
                  <img
                    src={selectedPage.picture?.data?.url || selectedPage.picture?.url}
                    alt={selectedPage.name}
                    className="h-8 w-8 rounded-lg flex-shrink-0 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{selectedPage.name}</div>
                    {selectedPage.connected_instagram_account && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Instagram className="h-3 w-3" />
                        {selectedPage.connected_instagram_account.username
                          ? `@${selectedPage.connected_instagram_account.username}`
                          : selectedPage.connected_instagram_account.name || 'Instagram connecté'}
                      </div>
                    )}
                  </div>
                  <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              ) : (
                <>
                  <div className="flex-1 text-sm text-muted-foreground">Choisir une page...</div>
                  <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown List */}
            {showPageDropdown && (
              <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-80 overflow-y-auto">
                {facebookPages.map((page: any) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setFacebookPageId(page.id)
                      setShowPageDropdown(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
                      facebookPageId === page.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <img
                      src={page.picture?.data?.url || page.picture?.url}
                      alt={page.name}
                      className="h-8 w-8 rounded-lg flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{page.name}</div>
                      {page.connected_instagram_account ? (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <Instagram className="h-3 w-3" />
                          {page.connected_instagram_account.username
                            ? `@${page.connected_instagram_account.username}`
                            : page.connected_instagram_account.name || 'Instagram connecté'}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Pas d'Instagram connecté</div>
                      )}
                    </div>
                    {facebookPageId === page.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={facebookPageId || ''}
            onChange={(e) => setFacebookPageId(e.target.value)}
            placeholder="ID de la page Facebook (ex: 397742766762941)"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        )}
        </div>

        {/* Instagram Account */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-100">
              <Instagram className="h-4 w-4 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Compte Instagram</h4>
              <p className="text-xs text-muted-foreground truncate">Connecté à votre page</p>
            </div>
            {instagramAccountId && (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
          </div>

          {facebookPageId ? (
            connectedInstagramId ? (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                {selectedPage?.connected_instagram_account?.profile_picture_url ? (
                  <img
                    src={selectedPage.connected_instagram_account.profile_picture_url}
                    alt="Instagram profile"
                    className="h-8 w-8 rounded-full flex-shrink-0 object-cover"
                  />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900 truncate">
                    {selectedPage?.connected_instagram_account?.name || selectedPage?.connected_instagram_account?.username || 'Instagram connecté'}
                  </p>
                  {selectedPage?.connected_instagram_account?.username && (
                    <p className="text-xs text-green-700 truncate">@{selectedPage.connected_instagram_account.username}</p>
                  )}
                  <p className="text-xs text-green-700">Détecté automatiquement</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="text-yellow-600 text-xs">⚠️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-yellow-900">Aucun compte connecté</p>
                    <p className="text-xs text-yellow-700 truncate">Entrez un ID manuellement</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={instagramAccountId || ''}
                  onChange={(e) => setInstagramAccountId(e.target.value)}
                  placeholder="ID Instagram"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
              Sélectionnez d'abord une page Facebook
            </div>
          )}
        </div>
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Campaign Name *</label>
        <input
          type="text"
          value={campaign.name || ''}
          onChange={(e) => updateCampaign({ name: e.target.value })}
          placeholder="Black Friday 2025"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Campaign Type & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Campaign Type *</label>
          <select
            value={campaign.type}
            onChange={(e) => updateCampaign({ type: e.target.value as CampaignType })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {CAMPAIGN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Country</label>
          <select
            value={campaign.country || ''}
            onChange={(e) => updateCampaign({ country: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Redirection */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Redirection</h4>

        <div className="flex gap-2">
          <button
            onClick={() => handleRedirectionTypeChange('LANDING_PAGE')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              campaign.redirectionType === 'LANDING_PAGE'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
            }`}
          >
            Landing Page
          </button>
          <button
            onClick={() => handleRedirectionTypeChange('LEAD_FORM')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              campaign.redirectionType === 'LEAD_FORM'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
            }`}
          >
            Lead Form
          </button>
          <button
            onClick={() => handleRedirectionTypeChange('DEEPLINK')}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              campaign.redirectionType === 'DEEPLINK'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
            }`}
          >
            Deeplink
          </button>
        </div>

        {campaign.redirectionType === 'LANDING_PAGE' && (
          <input
            type="url"
            value={campaign.redirectionUrl || ''}
            onChange={(e) => updateCampaign({ redirectionUrl: e.target.value })}
            onBlur={(e) => handleUrlBlur(e.target.value)}
            placeholder="example.com (https:// will be added automatically)"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        )}

        {campaign.redirectionType === 'LEAD_FORM' && (
          <input
            type="text"
            value={campaign.redirectionFormId || ''}
            onChange={(e) => updateCampaign({ redirectionFormId: e.target.value })}
            placeholder="Form ID"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        )}

        {campaign.redirectionType === 'DEEPLINK' && (
          <input
            type="text"
            value={campaign.redirectionDeeplink || ''}
            onChange={(e) => updateCampaign({ redirectionDeeplink: e.target.value })}
            placeholder="myapp://product/123"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        )}
      </div>

      {/* URL Parameters */}
      {campaign.redirectionType === 'LANDING_PAGE' && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">URL Tracking Parameters</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add UTM and custom tracking parameters
              </p>
            </div>
            <button
              onClick={() => setShowUrlParamsModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              type="button"
            >
              <Settings className="h-4 w-4" />
              Configure
            </button>
          </div>

          {campaign.urlParamsOverride && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-mono text-muted-foreground truncate">
                {campaign.urlParamsOverride.length > 100
                  ? `${campaign.urlParamsOverride.substring(0, 100)}...`
                  : campaign.urlParamsOverride}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {campaign.urlParamsOverride.split('&').length} parameter(s) configured
              </p>
            </div>
          )}
        </div>
      )}

      {/* Budget */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Budget</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Budget Mode</label>
            <select
              value={campaign.budgetMode}
              onChange={(e) => updateCampaign({ budgetMode: e.target.value as BudgetMode })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="CBO">CBO (Campaign Budget)</option>
              <option value="ABO">ABO (Ad Set Budget)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-2">Budget Type</label>
            <select
              value={campaign.budgetType}
              onChange={(e) => updateCampaign({ budgetType: e.target.value as 'daily' | 'lifetime' })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="daily">Daily</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
        </div>

        {campaign.budgetMode === 'CBO' && (
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Campaign Budget ($)</label>
            <input
              type="number"
              value={campaign.budget || ''}
              onChange={(e) => updateCampaign({ budget: parseFloat(e.target.value) || undefined })}
              placeholder="1000"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {campaign.budgetMode === 'ABO' && stats.adSets > 0 && (
          <div className={`rounded-lg p-3 ${showAboWarning ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total ABO Budget ({campaign.budgetType})</p>
                <p className="text-sm font-semibold text-foreground">
                  {stats.adSets} Ad Sets × ${bulkAudiences.budgetPerAdSet || 0} = ${aboTotalBudget}
                </p>
              </div>
              {showAboWarning && (
                <div className="text-xs text-yellow-700 font-medium">
                  ⚠️ Exceeds campaign budget (${campaign.budget})
                </div>
              )}
            </div>
            {campaign.budget && !showAboWarning && (
              <p className="text-xs text-green-600 mt-1">✓ Within campaign budget limit (${campaign.budget})</p>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Start Date *</label>
          <input
            type="date"
            value={campaign.startDate}
            onChange={(e) => updateCampaign({ startDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">End Date (optional)</label>
          <input
            type="date"
            value={campaign.endDate || ''}
            onChange={(e) => updateCampaign({ endDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* URL Parameters Modal */}
      <UrlParamsModal
        open={showUrlParamsModal}
        onClose={() => setShowUrlParamsModal(false)}
        urlParams={campaign.urlParamsOverride || ''}
        onSave={(params) => updateCampaign({ urlParamsOverride: params })}
      />
    </div>
  )
}
