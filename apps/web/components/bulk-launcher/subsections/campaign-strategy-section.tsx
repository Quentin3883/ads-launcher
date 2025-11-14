'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import type { CampaignType } from '@launcher-ads/sdk'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Traffic', label: 'Traffic' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Leads', label: 'Leads' },
  { value: 'AppPromotion', label: 'App Promotion' },
  { value: 'Sales', label: 'Sales' },
]

interface CampaignStrategySectionProps {
  onComplete?: () => void
}

export function CampaignStrategySection({ onComplete }: CampaignStrategySectionProps) {
  const { campaign, updateCampaign } = useBulkLauncher()

  const handleSelect = (type: CampaignType) => {
    updateCampaign({ type, objective: type })
    // Auto-jump to next section after selection
    if (onComplete) {
      setTimeout(() => {
        onComplete()
      }, 300) // Small delay for visual feedback
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Objective</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {CAMPAIGN_TYPES.map((type) => (
            <Button
              key={type.value}
              type="button"
              variant={campaign.type === type.value ? 'default' : 'outline'}
              onClick={() => handleSelect(type.value)}
              className="h-auto py-4"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
