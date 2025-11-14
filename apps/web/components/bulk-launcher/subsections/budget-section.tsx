'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Input } from '../ui/shadcn'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function BudgetSection() {
  const { campaign, updateCampaign, bulkAudiences, updateBulkAudiences, getMatrixStats } = useBulkLauncher()

  const stats = getMatrixStats()
  const aboTotalBudget = campaign.budgetMode === 'ABO' ? stats.adSets * (bulkAudiences.budgetPerAdSet || 0) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Mode */}
        <div className="space-y-2">
          <Label>Budget Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={campaign.budgetMode === 'CBO' ? 'default' : 'outline'}
              onClick={() => updateCampaign({ budgetMode: 'CBO' })}
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-semibold">Campaign Budget</div>
                  <div className="text-xs opacity-80 font-normal">Budget at campaign level</div>
                </div>
                {campaign.budgetMode === 'CBO' && <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>}
              </div>
            </Button>
            <Button
              type="button"
              variant={campaign.budgetMode === 'ABO' ? 'default' : 'outline'}
              onClick={() => updateCampaign({ budgetMode: 'ABO' })}
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-semibold">Ad Set Budget</div>
                  <div className="text-xs opacity-80 font-normal">Budget per Ad Set</div>
                </div>
                {campaign.budgetMode === 'ABO' && <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>}
              </div>
            </Button>
          </div>
        </div>

        {campaign.budgetMode === 'CBO' && (
          <div className="space-y-2">
            <Label>Budget Amount (€)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={campaign.budgetType === 'daily' ? 'default' : 'secondary'}
                onClick={() => updateCampaign({ budgetType: 'daily' })}
                size="sm"
              >
                Daily
              </Button>
              <Button
                type="button"
                variant={campaign.budgetType === 'lifetime' ? 'default' : 'secondary'}
                onClick={() => updateCampaign({ budgetType: 'lifetime' })}
                size="sm"
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
        )}

        {/* ABO Budget Input */}
        {campaign.budgetMode === 'ABO' && (
          <div className="space-y-2">
            <Label>Budget per Ad Set (€)</Label>
            <Input
              value={bulkAudiences.budgetPerAdSet?.toString() || ''}
              onChange={(value) => updateBulkAudiences({ budgetPerAdSet: parseFloat(value) || undefined })}
              type="number"
              prefix="€"
              placeholder="50"
              hint="Minimum 1€ per ad set per day (Facebook requirement)"
            />
            {stats.adSets > 0 && bulkAudiences.budgetPerAdSet && (
              <p className="text-sm text-muted-foreground">
                {stats.adSets} Ad Sets × €{bulkAudiences.budgetPerAdSet} = €{aboTotalBudget} total budget
              </p>
            )}
            {bulkAudiences.budgetPerAdSet && bulkAudiences.budgetPerAdSet < 1 && (
              <p className="text-sm text-destructive">
                ⚠️ Budget must be at least 1€ per ad set per day
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
