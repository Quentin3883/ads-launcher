'use client'

import { FormField } from '@/components/ui/form-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { LANGUAGES } from '@launcher-ads/sdk'
import type { Demographics } from '@launcher-ads/sdk'

interface DemographicsEditorProps {
  demographics: Demographics
  onUpdate: (demographics: Partial<Demographics>) => void
}

export function DemographicsEditor({ demographics, onUpdate }: DemographicsEditorProps) {
  const hasNoLanguages = !demographics.languages || demographics.languages.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={demographics.gender} onValueChange={(val) => onUpdate({ gender: val as any })}>
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Languages (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => {
              const isSelected = demographics.languages?.includes(language)
              return (
                <Badge
                  key={language}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = demographics.languages || []
                    const newLanguages = current.includes(language)
                      ? current.filter((l) => l !== language)
                      : [...current, language]
                    onUpdate({ languages: newLanguages })
                  }}
                >
                  {language}
                </Badge>
              )
            })}
          </div>
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
      </CardContent>
    </Card>
  )
}
