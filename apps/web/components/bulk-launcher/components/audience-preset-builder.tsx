'use client'

import { useState } from 'react'
import type { AudiencePresetType } from '@launcher-ads/sdk'
import { INTERESTS_OPTIONS } from '@launcher-ads/sdk'
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { FormField } from '@/components/ui/form-field'
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
        <label className="block text-sm font-medium text-foreground mb-2">Audience Type</label>
        <div className="grid grid-cols-4 gap-2">
          {AUDIENCE_PRESET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setNewAudienceType(type.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                newAudienceType === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <div
                className={`font-medium text-sm ${
                  newAudienceType === type.value ? 'text-primary' : 'text-foreground'
                }`}
              >
                {type.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Fields */}
      {newAudienceType === 'INTEREST' && (
        <ToggleButtonGroup
          label="Select Interests"
          items={INTERESTS_OPTIONS}
          selectedItems={selectedInterests}
          onToggle={(interest) =>
            setSelectedInterests((prev) =>
              prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
            )
          }
        />
      )}

      {newAudienceType === 'LOOKALIKE' && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="LAL Source"
            value={lalSource}
            onChange={setLalSource}
            placeholder="e.g., Website Visitors 30D"
          />
          <ToggleButtonGroup
            label="LAL %"
            items={LAL_PERCENTAGES.map((p) => `${p}%`)}
            selectedItems={lalPercentages.map((p) => `${p}%`)}
            onToggle={(pct) => {
              const num = parseInt(pct)
              setLalPercentages((prev) =>
                prev.includes(num) ? prev.filter((p) => p !== num) : [...prev, num]
              )
            }}
          />
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

      <button
        onClick={handleAdd}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
      >
        <Plus className="h-4 w-4" />
        Add Audience
      </button>
    </div>
  )
}
