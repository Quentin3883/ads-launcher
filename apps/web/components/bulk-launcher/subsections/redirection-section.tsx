'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import type { RedirectionType, DestinationType } from '@launcher-ads/sdk'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Input, Select } from '../ui/shadcn'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { isValidUrl } from '@/lib/validation/url'

// Helper: Map deprecated redirectionType to new destinationType
const mapToDestinationType = (redirectionType?: RedirectionType): DestinationType | undefined => {
  if (!redirectionType) return undefined
  const map: Record<RedirectionType, DestinationType> = {
    'LANDING_PAGE': 'WEBSITE',
    'LEAD_FORM': 'ON_AD',
    'DEEPLINK': 'APP',
  }
  return map[redirectionType]
}

// Helper: Map new destinationType to deprecated redirectionType (for backward compatibility)
const mapToRedirectionType = (destinationType?: DestinationType): RedirectionType | undefined => {
  if (!destinationType) return undefined
  const map: Partial<Record<DestinationType, RedirectionType>> = {
    'WEBSITE': 'LANDING_PAGE',
    'ON_AD': 'LEAD_FORM',
    'APP': 'DEEPLINK',
    'MESSENGER': 'LANDING_PAGE', // Fallback
    'WHATSAPP': 'LANDING_PAGE', // Fallback
    'SHOP_AUTOMATIC': 'LANDING_PAGE', // Fallback
    'NONE': 'LANDING_PAGE', // Fallback
  }
  return map[destinationType]
}

export function RedirectionSection() {
  const { campaign, updateCampaign, facebookPageId, adAccountId } = useBulkLauncher()

  // Use destinationType if available, fallback to redirectionType for backward compatibility
  const currentDestination = campaign.destinationType || mapToDestinationType(campaign.redirectionType)

  // Fetch Lead Forms
  const { data: leadForms, isLoading: isLoadingLeadForms } = trpc.facebookCampaigns.getLeadForms.useQuery(
    { adAccountId: adAccountId!, pageId: facebookPageId! },
    { enabled: !!adAccountId && !!facebookPageId && currentDestination === 'ON_AD' }
  )

  // Check if URL is required
  const isUrlRequired = ['Traffic', 'Engagement', 'Leads', 'Sales'].includes(campaign.type || '')

  // Get URL error message
  const getUrlError = (): string | undefined => {
    if (!campaign.redirectionUrl) return undefined
    if (!isValidUrl(campaign.redirectionUrl)) {
      return 'Please enter a valid URL (e.g., example.com or https://example.com)'
    }
    return undefined
  }

  const handleDestinationChange = (destination: DestinationType) => {
    // Update both destinationType (new) and redirectionType (deprecated, for backward compatibility)
    updateCampaign({
      destinationType: destination,
      redirectionType: mapToRedirectionType(destination),
      redirectionUrl: destination === 'WEBSITE' ? campaign.redirectionUrl : undefined,
      redirectionFormId: destination === 'ON_AD' ? campaign.redirectionFormId : undefined,
    })
  }

  const handleUrlBlur = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      updateCampaign({ redirectionUrl: `https://${url}` })
    }
  }

  const leadFormOptions = leadForms?.length
    ? leadForms.map((form: any) => ({
        value: form.id,
        label: form.name,
      }))
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Destination</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>
            Destination Type
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {/* None (default) - destination_type: null in Meta API */}
            <Button
              type="button"
              onClick={() =>
                updateCampaign({
                  destinationType: 'NONE',
                  redirectionType: undefined as any,
                  redirectionFormId: undefined,
                })
              }
              variant={currentDestination === 'NONE' || !currentDestination ? 'default' : 'outline'}
              className="h-auto py-3"
            >
              Default
            </Button>

            {/* Lead Form - Only for Leads (destination_type: ON_AD) */}
            <Button
              type="button"
              disabled={campaign.type !== 'Leads'}
              onClick={() => handleDestinationChange('ON_AD')}
              variant={currentDestination === 'ON_AD' ? 'default' : 'outline'}
              className="h-auto py-3"
            >
              Lead Form
            </Button>

            {/* Catalog - For Sales only (destination_type: WEBSITE with product_catalog_id) */}
            <Button
              type="button"
              disabled={true}
              onClick={() => handleDestinationChange('WEBSITE')}
              variant={currentDestination === 'WEBSITE' ? 'default' : 'outline'}
              className="h-auto py-3 relative"
            >
              Catalog
              <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.type === 'Awareness' && 'Default: Reach/impressions. Website URL optional.'}
            {campaign.type === 'Traffic' && 'Default: Link clicks to your website. Website URL required below.'}
            {campaign.type === 'Leads' && 'Default: Website conversions with pixel. Or choose Lead Form for instant forms.'}
            {campaign.type === 'Sales' && 'Default: Website conversions. Or choose Catalog for product catalog sales.'}
            {campaign.type === 'Engagement' && 'Default: Engagement on your posts/videos. Website URL required.'}
            {campaign.type === 'AppPromotion' && 'Default: App installs. No website URL needed.'}
            {!campaign.type && 'Select a campaign objective first'}
          </p>
        </div>

        {/* Website URL - Required for most objectives except Awareness & AppPromotion */}
        {currentDestination !== 'ON_AD' && campaign.type !== 'AppPromotion' && (
          <div className="space-y-4">
            <Input
              value={campaign.redirectionUrl || ''}
              onChange={(value) => updateCampaign({ redirectionUrl: value })}
              onBlur={() => handleUrlBlur(campaign.redirectionUrl || '')}
              type="url"
              label="Website URL"
              required={isUrlRequired}
              error={getUrlError()}
              placeholder="example.com (https:// will be added automatically)"
              hint={
                getUrlError() ? undefined :
                currentDestination === 'WEBSITE'
                  ? 'Product catalog URL - product_catalog_id will be set at campaign level'
                  : 'This URL will be used in your ad creative (link_data.link)'
              }
            />

            <Input
              value={campaign.displayLink || ''}
              onChange={(value) => updateCampaign({ displayLink: value })}
              type="url"
              label="Display Link"
              placeholder="example.com/special-offer"
              hint="Le lien affiché dans l'annonce (ex: example.com/special-offer)"
            />

            {/* URL Parameters */}
            <div className="space-y-2">
              <Label>URL Parameters (optional)</Label>
              <Textarea
                value={campaign.urlParamsOverride || ''}
                onChange={(e) => updateCampaign({ urlParamsOverride: e.target.value })}
                placeholder="utm_source=facebook&utm_medium=paid_social&visuel={{ad.name}}"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground',
                  'font-mono text-xs resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'transition-colors'
                )}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {'Variables: {{ad.name}}, {{campaign.name}}, {{adset.name}}, {{placement}}'}
              </p>
            </div>
          </div>
        )}

        {/* Lead Form */}
        {currentDestination === 'ON_AD' && (
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
      </CardContent>
    </Card>
  )
}
