'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { COUNTRIES } from '@/lib/types/bulk-launcher'
import type { CampaignType, RedirectionType, BudgetMode } from '@/lib/types/bulk-launcher'

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Traffic', label: 'Traffic' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Leads', label: 'Leads' },
  { value: 'AppPromotion', label: 'App Promotion' },
  { value: 'Sales', label: 'Sales' },
]

export function CampaignConfigStep() {
  const { campaign, updateCampaign } = useBulkLauncher()

  const handleRedirectionTypeChange = (type: RedirectionType) => {
    updateCampaign({
      redirectionType: type,
      redirectionUrl: type === 'LANDING_PAGE' ? campaign.redirectionUrl : undefined,
      redirectionFormId: type === 'LEAD_FORM' ? campaign.redirectionFormId : undefined,
      redirectionDeeplink: type === 'DEEPLINK' ? campaign.redirectionDeeplink : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Campaign Name *</label>
        <input
          type="text"
          value={campaign.name}
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
            placeholder="https://example.com/landing-page"
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
    </div>
  )
}
