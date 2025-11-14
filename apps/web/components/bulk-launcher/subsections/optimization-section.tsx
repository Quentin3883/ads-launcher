'use client'

import { useMemo, useEffect } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import {
  ODAX_OPTIMIZATION_GOALS,
  DEFAULT_OPTIMIZATION_GOAL,
  requiresPixel,
  type DestinationType
} from '@launcher-ads/sdk'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Select } from '../ui/shadcn'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'

// Helper: Map deprecated redirectionType to destinationType
const mapToDestinationType = (redirectionType?: any): DestinationType | undefined => {
  if (!redirectionType) return undefined
  const map: Record<string, DestinationType> = {
    'LANDING_PAGE': 'WEBSITE',
    'LEAD_FORM': 'ON_AD',
    'DEEPLINK': 'APP',
  }
  return map[redirectionType] || undefined
}

export function OptimizationSection() {
  const { campaign, bulkAudiences, updateBulkAudiences, adAccountId, facebookPixelId, setFacebookPixelId } = useBulkLauncher()

  // Get current destination (use new destinationType or fallback to old redirectionType)
  const currentDestination = campaign.destinationType || mapToDestinationType(campaign.redirectionType)

  // Check if pixel is needed based on v24 ODAX rules
  const needsPixel = requiresPixel(campaign.type!, currentDestination)

  // Get available optimization goals based on objective + destination (Meta Ads v24 ODAX)
  const availableOptimizationGoals = useMemo(() => {
    const campaignType = campaign.type || 'Traffic'
    const destination = currentDestination || 'WEBSITE'

    const goals = ODAX_OPTIMIZATION_GOALS[campaignType]?.[destination]
    return goals || ['LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS'] // Fallback
  }, [campaign.type, currentDestination])

  // Auto-set optimization goal when campaign type or destination changes (but not on initial empty load)
  useEffect(() => {
    const currentGoal = bulkAudiences.optimizationEvent

    // Only update if current goal is set AND not available (campaign type/destination changed)
    // Don't auto-set on initial empty state - user must explicitly select
    if (currentGoal && !availableOptimizationGoals.includes(currentGoal)) {
      const defaultGoal = DEFAULT_OPTIMIZATION_GOAL[campaign.type!]?.[currentDestination!]
      updateBulkAudiences({ optimizationEvent: defaultGoal || availableOptimizationGoals[0] })
    }
  }, [campaign.type, currentDestination, availableOptimizationGoals, bulkAudiences.optimizationEvent, updateBulkAudiences])

  // Fetch Facebook Pixels
  const { data: facebookPixels, isLoading: isLoadingPixels } = trpc.facebookCampaigns.getAdAccountPixels.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId }
  )

  // Fetch pixel events and custom conversions when pixel is configured
  const { data: pixelEvents } = trpc.facebookCampaigns.getPixelEvents.useQuery(
    { adAccountId: adAccountId!, pixelId: facebookPixelId! },
    { enabled: !!adAccountId && !!facebookPixelId }
  )

  const { data: customConversions } = trpc.facebookCampaigns.getCustomConversions.useQuery(
    { adAccountId: adAccountId! },
    { enabled: !!adAccountId && !!facebookPixelId }
  )

  // Convert pixels to options
  const pixelOptions = facebookPixels?.length
    ? [
        { value: '', label: 'Aucun pixel' },
        ...facebookPixels.map((pixel: any) => ({
          value: pixel.id,
          label: `${pixel.name} (ID: ${pixel.id})`,
        })),
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pixel Selection - Only for landing page redirections */}
        {needsPixel && (
          <div>
            <Label>Facebook Pixel</Label>
            {isLoadingPixels ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading pixels...</span>
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
              <p className="text-sm text-muted-foreground mt-2">
                Aucun pixel disponible pour ce compte
              </p>
            )}
          </div>
        )}

        <div>
          <Select
            label="Optimization Goal"
            value={bulkAudiences.optimizationEvent}
            onChange={(val) => updateBulkAudiences({ optimizationEvent: val })}
            options={availableOptimizationGoals.map((goal) => ({
              value: goal,
              label: goal.replace(/_/g, ' '),
            }))}
            required
            hint={`Available goals for ${campaign.type} → ${currentDestination || 'WEBSITE'}`}
          />
        </div>

        {/* Pixel Conversion Event - Combined dropdown - Only for landing pages with pixel */}
        {needsPixel && facebookPixelId && (pixelEvents || customConversions) && (
          <div className="pt-2 border-t border-border space-y-4">
            <div>
              <Label>
                Événement de Conversion (optionnel)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Sélectionner un événement pixel ou une conversion personnalisée
              </p>
            </div>

            <div className="relative">
              <ShadcnSelect
                value={
                  bulkAudiences.customConversionId
                    ? `cc_${bulkAudiences.customConversionId}`
                    : bulkAudiences.customEventStr
                    ? `pe_${bulkAudiences.customEventStr}`
                    : ''
                }
                onValueChange={(value) => {
                  if (!value) {
                    // Clear selection
                    updateBulkAudiences({
                      customEventType: undefined,
                      customEventStr: undefined,
                      customConversionId: undefined
                    })
                  } else if (value.startsWith('pe_')) {
                    // Pixel Event selected
                    const eventName = value.substring(3)
                    updateBulkAudiences({
                      customEventType: 'OTHER',
                      customEventStr: eventName,
                      customConversionId: undefined
                    })
                  } else if (value.startsWith('cc_')) {
                    // Custom Conversion selected
                    const conversionId = value.substring(3)
                    const conversion = customConversions?.find((c: any) => c.id === conversionId)
                    updateBulkAudiences({
                      customConversionId: conversionId,
                      customEventStr: conversion?.name,
                      customEventType: conversion?.custom_event_type || 'LEAD'
                    })
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucun événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun événement</SelectItem>

                  {/* Pixel Events Section */}
                  {pixelEvents && pixelEvents.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>📊 Événements Pixel</SelectLabel>
                      {pixelEvents.map((event) => (
                        <SelectItem key={`pe_${event}`} value={`pe_${event}`}>
                          {event}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {/* Custom Conversions Section */}
                  {customConversions && customConversions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>🎯 Custom Conversions</SelectLabel>
                      {customConversions.map((conversion: any) => (
                        <SelectItem key={`cc_${conversion.id}`} value={`cc_${conversion.id}`}>
                          {conversion.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </ShadcnSelect>

              {/* Badge label when an option is selected */}
              {(bulkAudiences.customConversionId || bulkAudiences.customEventStr) && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                    bulkAudiences.customConversionId
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  )}>
                    {bulkAudiences.customConversionId ? 'Custom Conversion' : 'Pixel Event'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
