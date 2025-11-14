'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function ScheduleSection() {
  const { campaign, updateCampaign } = useBulkLauncher()
  // wantsSchedule: null = not selected, false = No, true = Yes
  const [wantsSchedule, setWantsSchedule] = useState<boolean | null>(
    campaign.startDate === 'NOW' ? false : campaign.startDate ? true : null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Do you want to schedule? */}
        <div className="space-y-2">
          <Label>Do you want to schedule your campaign?</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => {
                setWantsSchedule(false)
                updateCampaign({ startDate: 'NOW', startTime: undefined, endDate: undefined, endTime: undefined })
              }}
              variant={wantsSchedule === false ? 'default' : 'outline'}
              className="h-auto py-3"
            >
              No - Start Now
            </Button>
            <Button
              type="button"
              onClick={() => {
                setWantsSchedule(true)
                if (!campaign.startDate || campaign.startDate === 'NOW') {
                  updateCampaign({ startDate: new Date().toISOString().split('T')[0], startTime: '12:00' })
                }
              }}
              variant={wantsSchedule === true ? 'default' : 'outline'}
              className="h-auto py-3"
            >
              Yes - Schedule
            </Button>
          </div>
        </div>

        {/* Schedule Inputs - Only show if user wants to schedule */}
        {wantsSchedule === true && (
          <>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={campaign.startDate !== 'NOW' ? campaign.startDate : new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateCampaign({ startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={campaign.startTime || '12:00'}
                  onChange={(e) => updateCampaign({ startTime: e.target.value })}
                  className="w-28"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>End Date (Optional)</Label>
                {campaign.endDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCampaign({ endDate: undefined, endTime: undefined })}
                    className="h-auto py-0 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={campaign.endDate || ''}
                  onChange={(e) => updateCampaign({ endDate: e.target.value })}
                  min={campaign.startDate !== 'NOW' ? campaign.startDate : new Date().toISOString().split('T')[0]}
                  placeholder="Optional"
                  className="flex-1"
                />
                {campaign.endDate && (
                  <Input
                    type="time"
                    value={campaign.endTime || '12:00'}
                    onChange={(e) => updateCampaign({ endTime: e.target.value })}
                    className="w-28"
                  />
                )}
              </div>
            </div>
          </>
        )}

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
              <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between text-sm">
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
      </CardContent>
    </Card>
  )
}
