// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import type { CampaignType, RedirectionType } from '@launcher-ads/sdk'
import { Loader2 } from 'lucide-react'
import { UrlParamsModal } from '../url-params-modal'
import { trpc } from '@/lib/trpc'
import { Select, Input, FormSection, FormRow, ds, Button } from '../ui/shadcn'
import type { SelectOption } from '../ui/shadcn'
import { FacebookPageSelector } from '../campaign/FacebookPageSelector'
import { InstagramAccountDisplay } from '../campaign/InstagramAccountDisplay'
import { BudgetSelector } from '../campaign/BudgetSelector'
import { ScheduleSelector } from '../campaign/ScheduleSelector'
import { StrategySelector } from '../campaign/StrategySelector'

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
      <FormRow columns={2} gap="md">
        <FacebookPageSelector
          facebookPages={facebookPages}
          isLoading={isLoadingPages}
          selectedPageId={facebookPageId}
          onSelectPage={setFacebookPageId}
        />

        <InstagramAccountDisplay
          facebookPageId={facebookPageId}
          connectedAccount={selectedPage?.connected_instagram_account}
          manualAccountId={instagramAccountId}
          onSetManualAccountId={setInstagramAccountId}
        />
      </FormRow>

      {/* Pixel Section */}
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

      {/* Strategy Section */}
      <StrategySelector
        campaignType={campaign.type}
        redirectionType={campaign.redirectionType}
        redirectionUrl={campaign.redirectionUrl}
        displayLink={campaign.displayLink}
        redirectionFormId={campaign.redirectionFormId}
        leadFormOptions={leadFormOptions}
        isLoadingLeadForms={isLoadingLeadForms}
        onUpdateCampaignType={(type) => updateCampaign({ type })}
        onUpdateRedirectionType={(type) => updateCampaign({ redirectionType: type })}
        onUpdateRedirectionUrl={(url) => updateCampaign({ redirectionUrl: url })}
        onUpdateDisplayLink={(link) => updateCampaign({ displayLink: link })}
        onUpdateRedirectionFormId={(formId) => updateCampaign({ redirectionFormId: formId })}
      />

      {/* URL Parameters Section */}
      {campaign.redirectionType === 'LANDING_PAGE' && (
        <FormSection
          title="URL Tracking Parameters"
          badge={
            <Button
              onClick={() => setShowUrlParamsModal(true)}
              variant="link"
              className={ds.cn(ds.typography.caption, 'font-medium underline-offset-4 h-auto p-0')}
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
      )}

      {/* Budget & Schedule - 2 Columns */}
      <FormRow columns={2} gap="md">
        <BudgetSelector
          budgetMode={campaign.budgetMode}
          budgetType={campaign.budgetType}
          budget={campaign.budget}
          adSetsCount={stats.adSets}
          budgetPerAdSet={bulkAudiences.budgetPerAdSet}
          onUpdateBudgetMode={(mode) => updateCampaign({ budgetMode: mode })}
          onUpdateBudgetType={(type) => updateCampaign({ budgetType: type })}
          onUpdateBudget={(budget) => updateCampaign({ budget })}
        />

        <ScheduleSelector
          startDate={campaign.startDate}
          startTime={campaign.startTime}
          endDate={campaign.endDate}
          endTime={campaign.endTime}
          budgetMode={campaign.budgetMode}
          budgetType={campaign.budgetType}
          budget={campaign.budget}
          onUpdateStartDate={(date) => updateCampaign({ startDate: date })}
          onUpdateStartTime={(time) => updateCampaign({ startTime: time })}
          onUpdateEndDate={(date) => updateCampaign({ endDate: date })}
          onUpdateEndTime={(time) => updateCampaign({ endTime: time })}
        />
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
