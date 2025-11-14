'use client'

import { useState } from 'react'
import type { AudiencePresetType } from '@launcher-ads/sdk'
import { INTERESTS_OPTIONS } from '@launcher-ads/sdk'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const AUDIENCE_PRESET_TYPES: { value: AudiencePresetType; label: string; description: string }[] = [
  { value: 'BROAD', label: 'Broad', description: 'Wide reach, no targeting' },
  { value: 'INTEREST', label: 'Interests', description: 'Target by interests' },
  { value: 'LOOKALIKE', label: 'Lookalike', description: 'Similar to your audience' },
  { value: 'CUSTOM_AUDIENCE', label: 'Custom', description: 'Your own audience list' },
]

const LAL_PERCENTAGES = [1, 2, 3, 5, 10]

interface AudiencePresetBuilderProps {
  onAdd: (type: AudiencePresetType, data: any) => void
}

export function AudiencePresetBuilder({ onAdd }: AudiencePresetBuilderProps) {
  const [newAudienceType, setNewAudienceType] = useState<AudiencePresetType>('BROAD')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [lalSource, setLalSource] = useState('')
  const [lalPercentages, setLalPercentages] = useState<number[]>([1])
  const [customAudienceId, setCustomAudienceId] = useState('')

  const handleAdd = () => {
    switch (newAudienceType) {
      case 'BROAD':
        onAdd('BROAD', {})
        break
      case 'INTEREST':
        if (selectedInterests.length === 0) {
          alert('Please select at least one interest')
          return
        }
        onAdd('INTEREST', { interests: selectedInterests })
        setSelectedInterests([])
        break
      case 'LOOKALIKE':
        if (!lalSource) {
          alert('Please enter LAL source')
          return
        }
        onAdd('LOOKALIKE', { source: lalSource, percentages: lalPercentages })
        setLalSource('')
        setLalPercentages([1])
        break
      case 'CUSTOM_AUDIENCE':
        if (!customAudienceId) {
          alert('Please enter custom audience ID')
          return
        }
        onAdd('CUSTOM_AUDIENCE', { audienceId: customAudienceId })
        setCustomAudienceId('')
        break
    }
  }

  return (
    <div className="space-y-5">
      {/* Audience Type Selector */}
      <div>
        <Label>Audience Type</Label>
        <div className="grid grid-cols-4 gap-2">
          {AUDIENCE_PRESET_TYPES.map((type) => (
            <Button
              key={type.value}
              onClick={() => setNewAudienceType(type.value)}
              variant={newAudienceType === type.value ? 'default' : 'outline'}
              className="p-3 h-auto flex-col items-start"
            >
              <div className="font-medium text-sm">
                {type.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Conditional Fields */}
      {newAudienceType === 'INTEREST' && (
        <div className="space-y-2">
          <Label>Select Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_OPTIONS.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedInterests((prev) =>
                    prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
                  )
                }
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {newAudienceType === 'LOOKALIKE' && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="LAL Source"
            value={lalSource}
            onChange={setLalSource}
            placeholder="e.g., Website Visitors 30D"
          />
          <div className="space-y-2">
            <Label>LAL %</Label>
            <div className="flex flex-wrap gap-2">
              {LAL_PERCENTAGES.map((p) => (
                <Badge
                  key={p}
                  variant={lalPercentages.includes(p) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setLalPercentages((prev) =>
                      prev.includes(p) ? prev.filter((pct) => pct !== p) : [...prev, p]
                    )
                  }}
                >
                  {p}%
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {newAudienceType === 'CUSTOM_AUDIENCE' && (
        <FormField
          label="Custom Audience ID"
          value={customAudienceId}
          onChange={setCustomAudienceId}
          placeholder="e.g., 123456789"
        />
      )}

      <Button onClick={handleAdd} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Audience
      </Button>
    </div>
  )
}
