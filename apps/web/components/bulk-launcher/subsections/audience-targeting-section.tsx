'use client'

import { useState, useCallback, useMemo } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import {
  generateId,
  type AudiencePreset,
  type AudiencePresetType,
} from '@launcher-ads/sdk'
import { X } from 'lucide-react'
import { InterestAutocomplete } from '../components/interest-autocomplete'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const AUDIENCE_PRESET_TYPES: { value: AudiencePresetType; label: string; description: string }[] = [
  { value: 'BROAD', label: 'Broad', description: 'Wide reach, no targeting' },
  { value: 'INTEREST', label: 'Interests', description: 'Target by interests' },
  { value: 'LOOKALIKE', label: 'Lookalike', description: 'Similar to your audience' },
  { value: 'CUSTOM_AUDIENCE', label: 'Custom', description: 'Your own audience list' },
]

const LAL_PERCENTAGES = [1, 2, 3, 5, 10]

export function AudienceTargetingSection() {
  const { bulkAudiences, addAudience, removeAudience } = useBulkLauncher()
  const [newAudienceType, setNewAudienceType] = useState<AudiencePresetType>('BROAD')
  const [selectedInterests, setSelectedInterests] = useState<Array<{ id: string; name: string }>>([])
  const [lalSource, setLalSource] = useState('')
  const [lalPercentages, setLalPercentages] = useState<number[]>([1])
  const [customAudienceId, setCustomAudienceId] = useState('')

  // Get userId from URL params
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('userId') || 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
    }
    return 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
  }, [])

  const handleAddAudience = useCallback(() => {
    let audience: AudiencePreset | null = null

    switch (newAudienceType) {
      case 'BROAD':
        audience = {
          id: generateId(),
          type: 'BROAD',
          name: 'Broad',
        }
        break
      case 'INTEREST':
        if (selectedInterests.length === 0) {
          alert('Please select at least one interest')
          return
        }
        audience = {
          id: generateId(),
          type: 'INTEREST',
          name: `Interests: ${selectedInterests.slice(0, 2).map(i => i.name).join(', ')}${selectedInterests.length > 2 ? '...' : ''}`,
          interests: selectedInterests.map(i => i.id),
        }
        setSelectedInterests([])
        break
      case 'LOOKALIKE':
        if (!lalSource) {
          alert('Please enter LAL source')
          return
        }
        audience = {
          id: generateId(),
          type: 'LOOKALIKE',
          name: `LAL ${lalPercentages.join(', ')}% - ${lalSource}`,
          lookalikeSource: lalSource,
          lookalikePercentages: lalPercentages,
        }
        setLalSource('')
        setLalPercentages([1])
        break
      case 'CUSTOM_AUDIENCE':
        if (!customAudienceId) {
          alert('Please enter custom audience ID')
          return
        }
        audience = {
          id: generateId(),
          type: 'CUSTOM_AUDIENCE',
          name: `Custom: ${customAudienceId}`,
          customAudienceId,
        }
        setCustomAudienceId('')
        break
    }

    if (audience) {
      addAudience(audience)
    }
  }, [newAudienceType, selectedInterests, lalSource, lalPercentages, customAudienceId, addAudience])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audiences ({bulkAudiences.audiences.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Help Text when no audiences */}
        {bulkAudiences.audiences.length === 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">1</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Select an audience type below</p>
              <p className="text-xs text-blue-700 mt-1">Click on Broad for quick wide reach, or choose Interests/Lookalike/Custom to configure targeting.</p>
            </div>
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_PRESET_TYPES.map((type) => (
            <Button
              key={type.value}
              size="sm"
              onClick={() => {
                setNewAudienceType(type.value)
                // Auto-add Broad immediately
                if (type.value === 'BROAD') {
                  addAudience({
                    id: generateId(),
                    type: 'BROAD',
                    name: 'Broad',
                  })
                }
              }}
              variant={newAudienceType === type.value ? 'default' : 'outline'}
              className="rounded-full h-auto py-1.5 text-xs"
            >
              + {type.label}
            </Button>
          ))}
        </div>

        {/* Conditional inline forms */}
        {newAudienceType === 'INTEREST' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              Add Interest Audience
            </div>
            <InterestAutocomplete
              userId={userId}
              selectedInterests={selectedInterests}
              onAdd={(interest) => setSelectedInterests(prev => [...prev, interest])}
              onRemove={(id) => setSelectedInterests(prev => prev.filter(i => i.id !== id))}
              placeholder="Search interests..."
            />
            {selectedInterests.length > 0 && (
              <Button
                onClick={handleAddAudience}
                className="w-full h-auto py-1.5 text-xs"
              >
                Add ({selectedInterests.length} interests)
              </Button>
            )}
          </div>
        )}

        {newAudienceType === 'LOOKALIKE' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              Add Lookalike Audience
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="text"
                value={lalSource}
                onChange={(e) => setLalSource(e.target.value)}
                placeholder="LAL Source"
                className="px-3 py-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <div className="flex flex-wrap gap-1">
                {LAL_PERCENTAGES.map((pct) => (
                  <Button
                    key={pct}
                    size="sm"
                    onClick={() => {
                      setLalPercentages((prev) =>
                        prev.includes(pct) ? prev.filter((p) => p !== pct) : [...prev, pct]
                      )
                    }}
                    variant={lalPercentages.includes(pct) ? 'default' : 'outline'}
                    className="h-auto px-2 py-1 text-xs"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleAddAudience}
              className="w-full h-auto py-1.5 text-xs"
            >
              Add Lookalike
            </Button>
          </div>
        )}

        {newAudienceType === 'CUSTOM_AUDIENCE' && (
          <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              Add Custom Audience
            </div>
            <Input
              type="text"
              value={customAudienceId}
              onChange={(e) => setCustomAudienceId(e.target.value)}
              placeholder="Custom Audience ID"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Button
              onClick={handleAddAudience}
              className="w-full h-auto py-1.5 text-xs"
            >
              Add Custom Audience
            </Button>
          </div>
        )}

        {/* Added Audiences - Compact Pills */}
        {bulkAudiences.audiences.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2">Added:</div>
            <div className="flex flex-wrap gap-2">
              {bulkAudiences.audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <span>{audience.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAudience(audience.id)}
                    className="hover:bg-primary/20 rounded-full h-auto w-auto p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
