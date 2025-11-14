import { FormSection, FormRow, Select, Input, ds, Button } from '../ui/shadcn'
import type { CampaignType, RedirectionType, SelectOption } from '@launcher-ads/sdk'

interface StrategySelectorProps {
  campaignType: CampaignType
  redirectionType?: RedirectionType
  redirectionUrl?: string
  displayLink?: string
  redirectionFormId?: string
  leadFormOptions: SelectOption[]
  isLoadingLeadForms: boolean
  onUpdateCampaignType: (type: CampaignType) => void
  onUpdateRedirectionType: (type?: RedirectionType) => void
  onUpdateRedirectionUrl: (url?: string) => void
  onUpdateDisplayLink: (link?: string) => void
  onUpdateRedirectionFormId: (formId?: string) => void
}

const CAMPAIGN_TYPES: SelectOption[] = [
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Traffic', label: 'Traffic' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Leads', label: 'Leads' },
  { value: 'AppPromotion', label: 'App Promotion' },
  { value: 'Sales', label: 'Sales' },
]

/**
 * Campaign strategy selector
 * Handles campaign type, destination type, and redirection configuration
 */
export function StrategySelector({
  campaignType,
  redirectionType,
  redirectionUrl,
  displayLink,
  redirectionFormId,
  leadFormOptions,
  isLoadingLeadForms,
  onUpdateCampaignType,
  onUpdateRedirectionType,
  onUpdateRedirectionUrl,
  onUpdateDisplayLink,
  onUpdateRedirectionFormId,
}: StrategySelectorProps) {
  const handleRedirectionTypeChange = (type?: RedirectionType) => {
    onUpdateRedirectionType(type)
    if (type === 'LANDING_PAGE') {
      onUpdateRedirectionFormId(undefined)
    } else if (type === 'LEAD_FORM') {
      onUpdateRedirectionUrl(undefined)
    } else {
      onUpdateRedirectionUrl(undefined)
      onUpdateRedirectionFormId(undefined)
    }
  }

  const handleUrlBlur = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      onUpdateRedirectionUrl(`https://${url}`)
    }
  }

  return (
    <FormSection title="Campaign Strategy">
      <FormRow columns={2} gap="md">
        {/* Campaign Type */}
        <Select
          value={campaignType}
          onChange={(value) => onUpdateCampaignType(value as CampaignType)}
          options={CAMPAIGN_TYPES}
          label="Campaign Type"
          required
        />

        {/* Destination Type */}
        <div className={ds.spacing.vertical.sm}>
          <label className={ds.componentPresets.label}>
            Destination Type {campaignType !== 'Awareness' && '*'}
          </label>
          <div
            className={ds.cn('grid', campaignType === 'Awareness' ? 'grid-cols-2' : 'grid-cols-2', ds.spacing.gap.xs)}
          >
            {campaignType === 'Awareness' && (
              <Button
                type="button"
                onClick={() => handleRedirectionTypeChange(undefined)}
                variant={!redirectionType ? 'default' : 'outline'}
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
              variant={redirectionType === 'LANDING_PAGE' ? 'default' : 'outline'}
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
            {campaignType === 'Leads' && (
              <Button
                type="button"
                onClick={() => handleRedirectionTypeChange('LEAD_FORM')}
                variant={redirectionType === 'LEAD_FORM' ? 'default' : 'outline'}
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
          {campaignType === 'Awareness' && (
            <p className={ds.componentPresets.hint}>Destination is optional for Awareness campaigns</p>
          )}
        </div>
      </FormRow>

      {/* Redirection URL */}
      {redirectionType === 'LANDING_PAGE' && (
        <div className={ds.spacing.vertical.sm}>
          <Input
            value={redirectionUrl || ''}
            onChange={onUpdateRedirectionUrl}
            onBlur={() => handleUrlBlur(redirectionUrl || '')}
            type="url"
            label="Website URL"
            required
            placeholder="example.com (https:// will be added automatically)"
          />

          <Input
            value={displayLink || ''}
            onChange={onUpdateDisplayLink}
            label="Display Link"
            placeholder="example.com/special-offer"
            hint="Le lien affiché dans l'annonce (ex: example.com/special-offer)"
          />
        </div>
      )}

      {/* Lead Form */}
      {redirectionType === 'LEAD_FORM' && (
        <div>
          {isLoadingLeadForms ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : leadFormOptions.length > 0 ? (
            <Select
              value={redirectionFormId || ''}
              onChange={onUpdateRedirectionFormId}
              options={leadFormOptions}
              label="Lead Form"
              required
              placeholder="Select a lead form"
            />
          ) : (
            <Input
              value={redirectionFormId || ''}
              onChange={onUpdateRedirectionFormId}
              label="Lead Form"
              required
              placeholder="Form ID (no forms found on page)"
            />
          )}
        </div>
      )}
    </FormSection>
  )
}
