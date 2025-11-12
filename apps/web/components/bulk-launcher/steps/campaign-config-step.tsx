'use client'

import { useState, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import type { CampaignType, RedirectionType, BudgetMode } from '@launcher-ads/sdk'
import { Settings, Loader2, CheckCircle2, Facebook, Instagram } from 'lucide-react'
import { Select } from '@launcher-ads/ui'
import type { SelectOption } from '@launcher-ads/ui'
import { UrlParamsModal } from '../url-params-modal'
import { trpc } from '@/lib/trpc'

const CAMPAIGN_TYPES: SelectOption[] = [
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

  // Fetch Lead Forms from the selected Facebook Page
  const { data: leadForms, isLoading: isLoadingLeadForms } = trpc.facebookCampaigns.getLeadForms.useQuery(
    { adAccountId: adAccountId!, pageId: facebookPageId! },
    { enabled: !!adAccountId && !!facebookPageId && campaign.redirectionType === 'LEAD_FORM' }
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

      {/* Campaign Strategy */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <h3 className="text-base font-semibold text-foreground">Campaign Strategy</h3>

        {/* Campaign Type & Redirection - 2 Columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Campaign Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Campaign Type *</label>
            <Select
              value={campaign.type}
              onValueChange={(value) => updateCampaign({ type: value as CampaignType })}
              options={CAMPAIGN_TYPES}
              placeholder="Select campaign type"
              className="h-12 text-base"
            />
          </div>

          {/* Redirection Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Destination Type {campaign.type !== 'Awareness' && '*'}</label>
            <div className={`grid ${campaign.type === 'Awareness' ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
              {campaign.type === 'Awareness' && (
                <button
                  type="button"
                  onClick={() => updateCampaign({ redirectionType: undefined as any, redirectionUrl: undefined, redirectionFormId: undefined })}
                  className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    !campaign.redirectionType
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-border/60'
                  }`}
                >
                  None
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRedirectionTypeChange('LANDING_PAGE')}
                className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  campaign.redirectionType === 'LANDING_PAGE'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-border/60'
                }`}
              >
                Website URL
              </button>
              {campaign.type === 'Leads' && (
                <button
                  type="button"
                  onClick={() => handleRedirectionTypeChange('LEAD_FORM')}
                  className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    campaign.redirectionType === 'LEAD_FORM'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-border/60'
                  }`}
                >
                  Lead Form
                </button>
              )}
            </div>
            {campaign.type === 'Awareness' && (
              <p className="text-xs text-muted-foreground">Destination is optional for Awareness campaigns</p>
            )}
          </div>
        </div>

        {/* Redirection URL/Form */}
        {campaign.redirectionType === 'LANDING_PAGE' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Website URL *</label>
            <input
              type="url"
              value={campaign.redirectionUrl || ''}
              onChange={(e) => updateCampaign({ redirectionUrl: e.target.value })}
              onBlur={(e) => handleUrlBlur(e.target.value)}
              placeholder="example.com (https:// will be added automatically)"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {campaign.redirectionType === 'LEAD_FORM' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Lead Form *</label>
            {isLoadingLeadForms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : leadForms && leadForms.length > 0 ? (
              <Select
                value={campaign.redirectionFormId || ''}
                onValueChange={(value) => updateCampaign({ redirectionFormId: value })}
                options={leadForms.map((form: any) => ({
                  value: form.id,
                  label: form.name,
                }))}
                placeholder="Select a lead form"
                className="h-12 text-base"
              />
            ) : (
              <input
                type="text"
                value={campaign.redirectionFormId || ''}
                onChange={(e) => updateCampaign({ redirectionFormId: e.target.value })}
                placeholder="Form ID (no forms found on page)"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            )}
          </div>
        )}

      </div>

      {/* URL Parameters */}
      {campaign.redirectionType === 'LANDING_PAGE' && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">URL Tracking Parameters</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add UTM and custom tracking parameters
              </p>
            </div>
            <button
              onClick={() => setShowUrlParamsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              type="button"
            >
              <Settings className="h-4 w-4" />
              Configure
            </button>
          </div>

          {/* Facebook url_tags (UTM parameters) */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Facebook UTM Parameters (url_tags)</label>
            <input
              type="text"
              value={campaign.urlTags || ''}
              onChange={(e) => updateCampaign({ urlTags: e.target.value })}
              placeholder="utm_source=facebook&utm_medium=cpc&utm_campaign=summer"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
            <p className="text-xs text-muted-foreground">
              UTM parameters for Facebook ad creatives (will be added to all ads)
            </p>
          </div>
        </div>
      )}

      {/* Budget & Schedule - 2 Columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Budget Column */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">€</span>
            <h4 className="text-sm font-semibold text-foreground">Budget</h4>
          </div>

          {/* CBO / ABO Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Budget Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateCampaign({ budgetMode: 'CBO' })}
                className={`px-4 py-3.5 rounded-lg border-2 transition-all text-left ${
                  campaign.budgetMode === 'CBO'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-border/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${campaign.budgetMode === 'CBO' ? 'text-primary' : 'text-foreground'}`}>
                      Campaign Budget
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Budget au niveau campagne</div>
                  </div>
                  {campaign.budgetMode === 'CBO' && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateCampaign({ budgetMode: 'ABO' })}
                className={`px-4 py-3.5 rounded-lg border-2 transition-all text-left ${
                  campaign.budgetMode === 'ABO'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-border/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${campaign.budgetMode === 'ABO' ? 'text-primary' : 'text-foreground'}`}>
                      Ad Set Budget
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Budget par Ad Set</div>
                  </div>
                  {campaign.budgetMode === 'ABO' && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {campaign.budgetMode === 'CBO' && (
            <>
              {/* Budget Input with Daily/Lifetime Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Budget Amount (€)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCampaign({ budgetType: 'daily' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      campaign.budgetType === 'daily'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCampaign({ budgetType: 'lifetime' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      campaign.budgetType === 'lifetime'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Lifetime
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={campaign.budget || ''}
                    onChange={(e) => updateCampaign({ budget: parseFloat(e.target.value) || undefined })}
                    placeholder={campaign.budgetType === 'daily' ? '50' : '1500'}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </>
          )}

          {/* ABO Budget Display */}
          {campaign.budgetMode === 'ABO' && (
            <div className="rounded-lg bg-muted/30 border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">Le budget sera défini au niveau de chaque Ad Set</p>
              {stats.adSets > 0 && (
                <p className="text-sm font-medium">
                  {stats.adSets} Ad Sets × €{bulkAudiences.budgetPerAdSet || 0} = €{aboTotalBudget} total
                </p>
              )}
            </div>
          )}
        </div>

        {/* Schedule Column */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h4 className="text-sm font-semibold text-foreground">Schedule</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Start Date *</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateCampaign({ startDate: 'NOW', startTime: undefined })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    campaign.startDate === 'NOW'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (campaign.startDate === 'NOW') {
                      updateCampaign({ startDate: new Date().toISOString().split('T')[0], startTime: '12:00' })
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    campaign.startDate !== 'NOW'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Schedule
                </button>
              </div>
              {campaign.startDate !== 'NOW' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={campaign.startDate}
                      onChange={(e) => updateCampaign({ startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <input
                      type="time"
                      value={campaign.startTime || '12:00'}
                      onChange={(e) => updateCampaign({ startTime: e.target.value })}
                      className="w-28 px-3 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">End Date</label>
                {campaign.endDate && (
                  <button
                    type="button"
                    onClick={() => updateCampaign({ endDate: undefined, endTime: undefined })}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={campaign.endDate || ''}
                  onChange={(e) => updateCampaign({ endDate: e.target.value })}
                  min={campaign.startDate !== 'NOW' ? campaign.startDate : new Date().toISOString().split('T')[0]}
                  placeholder="Optional"
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {campaign.endDate && (
                  <input
                    type="time"
                    value={campaign.endTime || '12:00'}
                    onChange={(e) => updateCampaign({ endTime: e.target.value })}
                    className="w-28 px-3 py-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                )}
              </div>
            </div>

            {/* Calculation Display */}
            {campaign.budgetMode === 'CBO' && campaign.budget && campaign.startDate && campaign.endDate && (() => {
              const start = new Date(campaign.startDate)
              const end = new Date(campaign.endDate)
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

              if (days <= 0) return null

              const dailyEstimate = campaign.budgetType === 'lifetime' ? (campaign.budget / days).toFixed(2) : null
              const lifetimeEstimate = campaign.budgetType === 'daily' ? (campaign.budget * days).toFixed(2) : null

              return (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{days} jour{days > 1 ? 's' : ''}</span>
                    {campaign.budgetType === 'lifetime' && dailyEstimate && (
                      <span className="font-semibold text-primary">≈ €{dailyEstimate}/jour</span>
                    )}
                    {campaign.budgetType === 'daily' && lifetimeEstimate && (
                      <span className="font-semibold text-primary">≈ €{lifetimeEstimate} total</span>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
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
