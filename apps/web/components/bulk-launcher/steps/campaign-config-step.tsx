'use client'

import { useState, useEffect, useRef } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import type { CampaignType, RedirectionType, BudgetMode } from '@launcher-ads/sdk'
import { Settings, Loader2, CheckCircle2, Facebook, Instagram } from 'lucide-react'
import { UrlParamsModal } from '../url-params-modal'
import { trpc } from '@/lib/trpc'
import { Select, Input, FormSection, FormRow, ds, Button } from '../ui/shadcn'
import type { SelectOption } from '../ui/shadcn'

const CAMPAIGN_TYPES: SelectOption[] = [
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Traffic', label: 'Traffic' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Leads', label: 'Leads' },
  { value: 'AppPromotion', label: 'App Promotion' },
  { value: 'Sales', label: 'Sales' },
]

export function CampaignConfigStep() {
  const {
    campaign,
    updateCampaign,
    bulkAudiences,
    getMatrixStats,
    adAccountId,
    facebookPageId,
    setFacebookPageId,
    instagramAccountId,
    setInstagramAccountId,
    facebookPixelId,
    setFacebookPixelId,
  } = useBulkLauncher()

  const stats = getMatrixStats()
  const [showUrlParamsModal, setShowUrlParamsModal] = useState(false)
  const [showPageDropdown, setShowPageDropdown] = useState(false)

  // Fetch Facebook Pages
  const { data: facebookPages, isLoading: isLoadingPages } = trpc.facebookCampaigns.getUserPages.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Fetch Lead Forms
  const { data: leadForms, isLoading: isLoadingLeadForms } = trpc.facebookCampaigns.getLeadForms.useQuery(
    { adAccountId: adAccountId!, pageId: facebookPageId! },
    { enabled: !!adAccountId && !!facebookPageId && campaign.redirectionType === 'LEAD_FORM' }
  )

  // Fetch Facebook Pixels
  const { data: facebookPixels, isLoading: isLoadingPixels } = trpc.facebookCampaigns.getAdAccountPixels.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Auto-detect Instagram account
  const selectedPage = facebookPages?.find((page: any) => page.id === facebookPageId)
  const connectedInstagramId = selectedPage?.connected_instagram_account?.id

  // Auto-set Instagram account
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
  const aboTotalBudget = campaign.budgetMode === 'ABO' ? stats.adSets * (bulkAudiences.budgetPerAdSet || 0) : 0
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

  // Convert pixels to options
  const pixelOptions: SelectOption[] = facebookPixels?.length
    ? [
        { value: '', label: 'Aucun pixel' },
        ...facebookPixels.map((pixel: any) => ({
          value: pixel.id,
          label: `${pixel.name} (ID: ${pixel.id})`,
        })),
      ]
    : []

  // Convert lead forms to options
  const leadFormOptions: SelectOption[] = leadForms?.length
    ? leadForms.map((form: any) => ({
        value: form.id,
        label: form.name,
      }))
    : []

  return (
    <div className={ds.spacing.vertical.lg}>
      {/* Accounts Section */}
      <div>
        <FormRow columns={2} gap="md">
        {/* Facebook Page Selection */}
        <FormSection
          icon={
            <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('blue'))}>
              <Facebook className="h-4 w-4" />
            </div>
          }
          title="Facebook Page"
        >
          {isLoadingPages ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className={ds.cn('h-5 w-5 animate-spin text-primary')} />
            </div>
          ) : facebookPages && facebookPages.length > 0 ? (
            <div className="relative">
              {/* Selected Page Display */}
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPageDropdown(!showPageDropdown)
                }}
                variant="outline"
                className={ds.cn(
                  'w-full flex items-center justify-start',
                  ds.spacing.gap.sm,
                  ds.spacing.paddingX.compact,
                  'py-2',
                  ds.borders.radius.md,
                  ds.transitions.default,
                  'h-auto'
                )}
              >
                {selectedPage ? (
                  <>
                    <img
                      src={selectedPage.picture?.data?.url || selectedPage.picture?.url}
                      alt={selectedPage.name}
                      className={ds.cn('h-8 w-8', ds.borders.radius.md, 'flex-shrink-0 object-cover')}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={ds.cn(ds.typography.body, 'font-medium text-foreground')}>
                        {selectedPage.name}
                      </div>
                      {selectedPage.connected_instagram_account && (
                        <div className={ds.cn(ds.typography.caption, 'flex items-center gap-1')}>
                          <Instagram className="h-3 w-3" />
                          {selectedPage.connected_instagram_account.username
                            ? `@${selectedPage.connected_instagram_account.username}`
                            : selectedPage.connected_instagram_account.name || 'Instagram connecté'}
                        </div>
                      )}
                    </div>
                    <svg
                      className="h-4 w-4 text-muted-foreground flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <div className={ds.cn('flex-1', ds.typography.body, 'text-muted-foreground')}>
                      Choisir une page...
                    </div>
                    <svg
                      className="h-4 w-4 text-muted-foreground flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </Button>

              {/* Dropdown List */}
              {showPageDropdown && (
                <div
                  className={ds.cn(
                    'absolute z-50 w-full mt-1',
                    ds.borders.radius.md,
                    'border border-border bg-card',
                    ds.shadows.lg,
                    'max-h-80 overflow-y-auto'
                  )}
                >
                  {facebookPages.map((page: any) => (
                    <Button
                      key={page.id}
                      onClick={() => {
                        setFacebookPageId(page.id)
                        setShowPageDropdown(false)
                      }}
                      variant="ghost"
                      className={ds.cn(
                        'w-full flex items-center justify-start',
                        ds.spacing.gap.sm,
                        ds.spacing.paddingX.compact,
                        'py-2',
                        'text-left',
                        ds.transitions.default,
                        'border-b border-border last:border-b-0 rounded-none h-auto',
                        facebookPageId === page.id && 'bg-primary/5'
                      )}
                    >
                      <img
                        src={page.picture?.data?.url || page.picture?.url}
                        alt={page.name}
                        className={ds.cn('h-8 w-8', ds.borders.radius.md, 'flex-shrink-0 object-cover')}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={ds.cn(ds.typography.body, 'font-medium text-foreground')}>{page.name}</div>
                        {page.connected_instagram_account ? (
                          <div className={ds.cn(ds.typography.caption, 'text-green-600 flex items-center gap-1')}>
                            <Instagram className="h-3 w-3" />
                            {page.connected_instagram_account.username
                              ? `@${page.connected_instagram_account.username}`
                              : page.connected_instagram_account.name || 'Instagram connecté'}
                          </div>
                        ) : (
                          <div className={ds.cn(ds.typography.caption)}>Pas d'Instagram connecté</div>
                        )}
                      </div>
                      {facebookPageId === page.id && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Input
              value={facebookPageId || ''}
              onChange={setFacebookPageId}
              placeholder="ID de la page Facebook (ex: 397742766762941)"
            />
          )}
        </FormSection>

        {/* Instagram Account */}
        <FormSection
          icon={
            <div className={ds.cn('p-1.5', ds.borders.radius.md, ds.getIconColor('pink'))}>
              <Instagram className="h-4 w-4" />
            </div>
          }
          title="Instagram Account"
        >
          {facebookPageId ? (
            connectedInstagramId ? (
              <div
                className={ds.cn(
                  'flex items-center',
                  ds.spacing.gap.sm,
                  ds.spacing.paddingX.compact,
                  'py-2',
                  ds.borders.radius.md,
                  'bg-green-50 border border-green-200'
                )}
              >
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
                  <p className={ds.cn(ds.typography.body, 'font-semibold text-green-900 truncate')}>
                    {selectedPage?.connected_instagram_account?.name ||
                      selectedPage?.connected_instagram_account?.username ||
                      'Instagram connecté'}
                  </p>
                  {selectedPage?.connected_instagram_account?.username && (
                    <p className={ds.cn(ds.typography.caption, 'text-green-700 truncate')}>
                      @{selectedPage.connected_instagram_account.username}
                    </p>
                  )}
                  <p className={ds.cn(ds.typography.caption, 'text-green-700')}>Détecté automatiquement</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>
            ) : (
              <div className={ds.spacing.vertical.xs}>
                <div
                  className={ds.cn(
                    'flex items-center',
                    ds.spacing.gap.xs,
                    ds.spacing.paddingX.compact,
                    'py-2',
                    ds.borders.radius.md,
                    'bg-yellow-50 border border-yellow-200'
                  )}
                >
                  <div className="text-yellow-600 text-xs">⚠️</div>
                  <div className="flex-1 min-w-0">
                    <p className={ds.cn(ds.typography.caption, 'font-medium text-yellow-900')}>
                      Aucun compte connecté
                    </p>
                    <p className={ds.cn(ds.typography.caption, 'text-yellow-700 truncate')}>
                      Entrez un ID manuellement
                    </p>
                  </div>
                </div>
                <Input
                  value={instagramAccountId || ''}
                  onChange={setInstagramAccountId}
                  placeholder="ID Instagram"
                />
              </div>
            )
          ) : (
            <div className={ds.cn('flex items-center justify-center py-4', ds.typography.caption)}>
              Sélectionnez d'abord une page Facebook
            </div>
          )}
        </FormSection>
        </FormRow>
      </div>

      {/* Pixel Section */}
      <div>
        <FormSection title="Facebook Pixel">
        {isLoadingPixels ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className={ds.typography.body}>Loading pixels...</span>
          </div>
        ) : pixelOptions.length > 1 ? (
          <Select
            value={facebookPixelId || ''}
            onChange={setFacebookPixelId}
            options={pixelOptions}
            placeholder="Aucun pixel"
            hint="Sélectionner un pixel pour tracker les conversions et optimiser vos campagnes"
          />
        ) : (
          <p className={ds.cn(ds.typography.body, 'text-muted-foreground')}>
            Aucun pixel disponible pour ce compte
          </p>
        )}
        </FormSection>
      </div>

      {/* Strategy Section */}
      <div>
        <FormSection title="Campaign Strategy">
        <FormRow columns={2} gap="md">
          {/* Campaign Type */}
          <Select
            value={campaign.type}
            onChange={(value) => updateCampaign({ type: value as CampaignType })}
            options={CAMPAIGN_TYPES}
            label="Campaign Type"
            required
          />

          {/* Destination Type */}
          <div className={ds.spacing.vertical.sm}>
            <label className={ds.componentPresets.label}>
              Destination Type {campaign.type !== 'Awareness' && '*'}
            </label>
            <div className={ds.cn('grid', campaign.type === 'Awareness' ? 'grid-cols-2' : 'grid-cols-2', ds.spacing.gap.xs)}>
              {campaign.type === 'Awareness' && (
                <Button
                  type="button"
                  onClick={() =>
                    updateCampaign({
                      redirectionType: undefined as any,
                      redirectionUrl: undefined,
                      redirectionFormId: undefined,
                    })
                  }
                  variant={!campaign.redirectionType ? 'default' : 'outline'}
                  className={ds.cn(
                    ds.spacing.paddingX.default,
                    ds.spacing.paddingY.default,
                    ds.borders.radius.md,
                    'border-2',
                    ds.transitions.default,
                    ds.typography.body,
                    'font-medium'
                  )}
                >
                  None
                </Button>
              )}
              <Button
                type="button"
                onClick={() => handleRedirectionTypeChange('LANDING_PAGE')}
                variant={campaign.redirectionType === 'LANDING_PAGE' ? 'default' : 'outline'}
                className={ds.cn(
                  ds.spacing.paddingX.default,
                  ds.spacing.paddingY.default,
                  ds.borders.radius.md,
                  'border-2',
                  ds.transitions.default,
                  ds.typography.body,
                  'font-medium'
                )}
              >
                Website URL
              </Button>
              {campaign.type === 'Leads' && (
                <Button
                  type="button"
                  onClick={() => handleRedirectionTypeChange('LEAD_FORM')}
                  variant={campaign.redirectionType === 'LEAD_FORM' ? 'default' : 'outline'}
                  className={ds.cn(
                    ds.spacing.paddingX.default,
                    ds.spacing.paddingY.default,
                    ds.borders.radius.md,
                    'border-2',
                    ds.transitions.default,
                    ds.typography.body,
                    'font-medium'
                  )}
                >
                  Lead Form
                </Button>
              )}
            </div>
            {campaign.type === 'Awareness' && (
              <p className={ds.componentPresets.hint}>Destination is optional for Awareness campaigns</p>
            )}
          </div>
        </FormRow>

        {/* Redirection URL */}
        {campaign.redirectionType === 'LANDING_PAGE' && (
          <div className={ds.spacing.vertical.sm}>
            <Input
              value={campaign.redirectionUrl || ''}
              onChange={(value) => updateCampaign({ redirectionUrl: value })}
              onBlur={() => handleUrlBlur(campaign.redirectionUrl || '')}
              type="url"
              label="Website URL"
              required
              placeholder="example.com (https:// will be added automatically)"
            />

            <Input
              value={campaign.displayLink || ''}
              onChange={(value) => updateCampaign({ displayLink: value })}
              label="Display Link"
              placeholder="example.com/special-offer"
              hint="Le lien affiché dans l'annonce (ex: example.com/special-offer)"
            />
          </div>
        )}

        {/* Lead Form */}
        {campaign.redirectionType === 'LEAD_FORM' && (
          <div>
            {isLoadingLeadForms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : leadFormOptions.length > 0 ? (
              <Select
                value={campaign.redirectionFormId || ''}
                onChange={(value) => updateCampaign({ redirectionFormId: value })}
                options={leadFormOptions}
                label="Lead Form"
                required
                placeholder="Select a lead form"
              />
            ) : (
              <Input
                value={campaign.redirectionFormId || ''}
                onChange={(value) => updateCampaign({ redirectionFormId: value })}
                label="Lead Form"
                required
                placeholder="Form ID (no forms found on page)"
              />
            )}
          </div>
        )}
        </FormSection>
      </div>

      {/* URL Parameters Section */}
      {campaign.redirectionType === 'LANDING_PAGE' && (
        <div>
          <FormSection
          title="URL Tracking Parameters"
          badge={
            <Button
              onClick={() => setShowUrlParamsModal(true)}
              variant="link"
              className={ds.cn(
                ds.typography.caption,
                'font-medium underline-offset-4 h-auto p-0'
              )}
              type="button"
            >
              Configure
            </Button>
          }
        >
          <Input
            value={campaign.urlTags || ''}
            onChange={(value) => updateCampaign({ urlTags: value })}
            placeholder="utm_source=facebook&utm_medium=cpc&utm_campaign=summer"
            className="font-mono"
          />
        </FormSection>
        </div>
      )}

      {/* Budget & Schedule - 2 Columns */}
      <FormRow columns={2} gap="md">
        {/* Budget Section */}
        <div>
          <FormSection title="Budget">
          {/* Budget Mode */}
          <div className={ds.spacing.vertical.sm}>
            <label className={ds.componentPresets.label}>Budget Mode</label>
            <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
              <Button
                type="button"
                onClick={() => updateCampaign({ budgetMode: 'CBO' })}
                variant={campaign.budgetMode === 'CBO' ? 'default' : 'outline'}
                className={ds.cn(
                  ds.spacing.paddingX.default,
                  'py-3.5',
                  ds.borders.radius.md,
                  'border-2',
                  ds.transitions.default,
                  'text-left justify-start h-auto'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div
                      className={ds.cn(
                        ds.typography.body,
                        'font-semibold'
                      )}
                    >
                      Campaign Budget
                    </div>
                    <div className={ds.cn(ds.typography.caption, 'mt-0.5')}>Budget at campaign level</div>
                  </div>
                  {campaign.budgetMode === 'CBO' && <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0"></div>}
                </div>
              </Button>
              <Button
                type="button"
                onClick={() => updateCampaign({ budgetMode: 'ABO' })}
                variant={campaign.budgetMode === 'ABO' ? 'default' : 'outline'}
                className={ds.cn(
                  ds.spacing.paddingX.default,
                  'py-3.5',
                  ds.borders.radius.md,
                  'border-2',
                  ds.transitions.default,
                  'text-left justify-start h-auto'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div
                      className={ds.cn(
                        ds.typography.body,
                        'font-semibold'
                      )}
                    >
                      Ad Set Budget
                    </div>
                    <div className={ds.cn(ds.typography.caption, 'mt-0.5')}>Budget per Ad Set</div>
                  </div>
                  {campaign.budgetMode === 'ABO' && <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0"></div>}
                </div>
              </Button>
            </div>
          </div>

          {campaign.budgetMode === 'CBO' && (
            <>
              {/* Budget Type Toggle */}
              <div className={ds.spacing.vertical.sm}>
                <label className={ds.componentPresets.label}>Budget Amount (€)</label>
                <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
                  <Button
                    type="button"
                    onClick={() => updateCampaign({ budgetType: 'daily' })}
                    variant={campaign.budgetType === 'daily' ? 'default' : 'secondary'}
                    className={ds.cn(
                      ds.spacing.paddingX.default,
                      'py-2',
                      ds.borders.radius.md,
                      ds.typography.body,
                      'font-medium',
                      ds.transitions.default
                    )}
                  >
                    Daily
                  </Button>
                  <Button
                    type="button"
                    onClick={() => updateCampaign({ budgetType: 'lifetime' })}
                    variant={campaign.budgetType === 'lifetime' ? 'default' : 'secondary'}
                    className={ds.cn(
                      ds.spacing.paddingX.default,
                      'py-2',
                      ds.borders.radius.md,
                      ds.typography.body,
                      'font-medium',
                      ds.transitions.default
                    )}
                  >
                    Lifetime
                  </Button>
                </div>
                <Input
                  value={campaign.budget || ''}
                  onChange={(value) => updateCampaign({ budget: parseFloat(value) || undefined })}
                  type="number"
                  prefix="€"
                  placeholder={campaign.budgetType === 'daily' ? '50' : '1500'}
                />
              </div>
            </>
          )}

          {/* ABO Budget Display */}
          {campaign.budgetMode === 'ABO' && (
            <div className={ds.cn(ds.borders.radius.md, 'bg-muted/30 border border-border', ds.spacing.padding.md)}>
              <p className={ds.cn(ds.typography.caption, 'mb-2')}>Le budget sera défini au niveau de chaque Ad Set</p>
              {stats.adSets > 0 && (
                <p className={ds.cn(ds.typography.body, 'font-medium')}>
                  {stats.adSets} Ad Sets × €{bulkAudiences.budgetPerAdSet || 0} = €{aboTotalBudget} total
                </p>
              )}
            </div>
          )}
          </FormSection>
        </div>

        {/* Schedule Section */}
        <div>
          <FormSection title="Schedule">
          <div className={ds.spacing.vertical.md}>
            <div className={ds.spacing.vertical.sm}>
              <label className={ds.componentPresets.label}>Start Date *</label>
              <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
                <Button
                  type="button"
                  onClick={() => updateCampaign({ startDate: 'NOW', startTime: undefined })}
                  variant={campaign.startDate === 'NOW' ? 'default' : 'secondary'}
                  className={ds.cn(
                    ds.spacing.paddingX.default,
                    'py-2',
                    ds.borders.radius.md,
                    ds.typography.body,
                    'font-medium',
                    ds.transitions.default
                  )}
                >
                  Now
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (campaign.startDate === 'NOW') {
                      updateCampaign({ startDate: new Date().toISOString().split('T')[0], startTime: '12:00' })
                    }
                  }}
                  variant={campaign.startDate !== 'NOW' ? 'default' : 'secondary'}
                  className={ds.cn(
                    ds.spacing.paddingX.default,
                    'py-2',
                    ds.borders.radius.md,
                    ds.typography.body,
                    'font-medium',
                    ds.transitions.default
                  )}
                >
                  Schedule
                </Button>
              </div>
              {campaign.startDate !== 'NOW' && (
                <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
                  <input
                    type="date"
                    value={campaign.startDate}
                    onChange={(e) => updateCampaign({ startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className={ds.cn(ds.componentPresets.input, 'flex-1')}
                  />
                  <input
                    type="time"
                    value={campaign.startTime || '12:00'}
                    onChange={(e) => updateCampaign({ startTime: e.target.value })}
                    className={ds.cn(ds.componentPresets.input, 'w-28')}
                  />
                </div>
              )}
            </div>

            <div className={ds.spacing.vertical.sm}>
              <div className="flex items-center justify-between">
                <label className={ds.componentPresets.label}>End Date</label>
                {campaign.endDate && (
                  <Button
                    type="button"
                    onClick={() => updateCampaign({ endDate: undefined, endTime: undefined })}
                    variant="link"
                    className={ds.cn(ds.typography.caption, 'h-auto p-0')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
                <input
                  type="date"
                  value={campaign.endDate || ''}
                  onChange={(e) => updateCampaign({ endDate: e.target.value })}
                  min={campaign.startDate !== 'NOW' ? campaign.startDate : new Date().toISOString().split('T')[0]}
                  placeholder="Optional"
                  className={ds.cn(ds.componentPresets.input, 'flex-1')}
                />
                {campaign.endDate && (
                  <input
                    type="time"
                    value={campaign.endTime || '12:00'}
                    onChange={(e) => updateCampaign({ endTime: e.target.value })}
                    className={ds.cn(ds.componentPresets.input, 'w-28')}
                  />
                )}
              </div>
            </div>

            {/* Calculation Display */}
            {campaign.budgetMode === 'CBO' &&
              campaign.budget &&
              campaign.startDate &&
              campaign.endDate &&
              (() => {
                const start = new Date(campaign.startDate)
                const end = new Date(campaign.endDate)
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

                if (days <= 0) return null

                const dailyEstimate = campaign.budgetType === 'lifetime' ? (campaign.budget / days).toFixed(2) : null
                const lifetimeEstimate = campaign.budgetType === 'daily' ? (campaign.budget * days).toFixed(2) : null

                return (
                  <div
                    className={ds.cn(
                      ds.borders.radius.md,
                      'bg-primary/5 border border-primary/20',
                      ds.spacing.padding.md
                    )}
                  >
                    <div className={ds.cn('flex items-center justify-between', ds.typography.body)}>
                      <span className="text-muted-foreground font-medium">
                        {days} jour{days > 1 ? 's' : ''}
                      </span>
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
          </FormSection>
        </div>
      </FormRow>

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
