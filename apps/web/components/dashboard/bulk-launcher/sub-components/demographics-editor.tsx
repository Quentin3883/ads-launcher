'use client'

import { FormField } from '@/components/ui/form-field'
import { FormSelect } from '@/components/ui/form-select'
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { SectionCard } from '@/components/ui/section-card'
import { LANGUAGES } from '@/lib/types/bulk-launcher'
import type { Demographics } from '@/lib/types/bulk-launcher'

interface DemographicsEditorProps {
  demographics: Demographics
  onUpdate: (demographics: Partial<Demographics>) => void
}

export function DemographicsEditor({ demographics, onUpdate }: DemographicsEditorProps) {
  const hasNoLanguages = !demographics.languages || demographics.languages.length === 0

  return (
    <SectionCard title="Demographics">
      <div className="grid grid-cols-3 gap-4">
        <FormField
          label="Age Min"
          type="number"
          min={13}
          max={65}
          value={demographics.ageMin}
          onChange={(val) => onUpdate({ ageMin: Number(val) })}
        />
        <FormField
          label="Age Max"
          type="number"
          min={13}
          max={65}
          value={demographics.ageMax}
          onChange={(val) => onUpdate({ ageMax: Number(val) })}
        />
        <FormSelect
          label="Gender"
          value={demographics.gender}
          onChange={(val) => onUpdate({ gender: val as any })}
          options={['All', 'Male', 'Female']}
        />
      </div>

      <div className="space-y-2">
        <ToggleButtonGroup
          label="Languages (optional)"
          items={LANGUAGES}
          selectedItems={demographics.languages || []}
          onToggle={(language) => {
            const current = demographics.languages || []
            const newLanguages = current.includes(language)
              ? current.filter((l) => l !== language)
              : [...current, language]
            onUpdate({ languages: newLanguages })
          }}
        />
        {hasNoLanguages && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs">
            <div className="flex-shrink-0 mt-0.5">ℹ️</div>
            <div>
              <p className="font-medium text-blue-900">No languages selected</p>
              <p className="text-blue-700 mt-0.5">Campaign will target all languages by default</p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
