'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { LANGUAGES } from '@launcher-ads/sdk'
import { Select } from '../ui/shadcn'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AgeGenderSection() {
  const { bulkAudiences, updateBulkAudiences } = useBulkLauncher()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Range and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age Range Slider - Dual Handle */}
          <div>
            <Label>Age Range</Label>
            <div className="relative h-10 flex items-center mt-3">
              {/* Age labels above handles */}
              <div
                className="absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm text-xs font-medium"
                style={{
                  left: `calc(${((bulkAudiences.demographics.ageMin - 13) / (65 - 13)) * 100}% - 12px)`,
                  transition: 'left 0.05s ease-out'
                }}
              >
                {bulkAudiences.demographics.ageMin}
              </div>
              <div
                className="absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm text-xs font-medium"
                style={{
                  left: `calc(${((bulkAudiences.demographics.ageMax - 13) / (65 - 13)) * 100}% - 12px)`,
                  transition: 'left 0.05s ease-out'
                }}
              >
                {bulkAudiences.demographics.ageMax === 65 ? '65+' : bulkAudiences.demographics.ageMax}
              </div>

              {/* Track */}
              <div className="absolute w-full h-1.5 bg-muted rounded-full"></div>

              {/* Active track between handles */}
              <div
                className="absolute h-1.5 bg-primary rounded-full"
                style={{
                  left: `${((bulkAudiences.demographics.ageMin - 13) / (65 - 13)) * 100}%`,
                  right: `${100 - ((bulkAudiences.demographics.ageMax - 13) / (65 - 13)) * 100}%`,
                  transition: 'left 0.05s ease-out, right 0.05s ease-out'
                }}
              ></div>

              {/* Min handle */}
              <Input
                type="range"
                min={13}
                max={65}
                value={bulkAudiences.demographics.ageMin}
                onChange={(e) =>
                  updateBulkAudiences({
                    demographics: {
                      ...bulkAudiences.demographics,
                      ageMin: Math.min(Number(e.target.value), bulkAudiences.demographics.ageMax - 1)
                    },
                  })
                }
                className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
              />

              {/* Max handle */}
              <Input
                type="range"
                min={13}
                max={65}
                value={bulkAudiences.demographics.ageMax}
                onChange={(e) =>
                  updateBulkAudiences({
                    demographics: {
                      ...bulkAudiences.demographics,
                      ageMax: Math.max(Number(e.target.value), bulkAudiences.demographics.ageMin + 1)
                    },
                  })
                }
                className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
              />
            </div>
          </div>

          {/* Gender Selection (Pills) */}
          <div>
            <Label>Gender</Label>
            <div className="flex flex-wrap mt-2 gap-2">
              {['All', 'Male', 'Female'].map((gender) => (
                <Button
                  key={gender}
                  onClick={() =>
                    updateBulkAudiences({
                      demographics: { ...bulkAudiences.demographics, gender: gender as any },
                    })
                  }
                  variant={bulkAudiences.demographics.gender === gender ? 'default' : 'outline'}
                  className="rounded-full h-auto px-4 py-2 text-sm"
                >
                  {gender}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Languages Dropdown */}
        <div>
          <Select
            label="Languages (optional)"
            value={(bulkAudiences.demographics.languages || [])[0] || ''}
            onChange={(val) =>
              updateBulkAudiences({
                demographics: { ...bulkAudiences.demographics, languages: val ? [val] : [] },
              })
            }
            options={[
              { value: '', label: 'No language targeting' },
              ...LANGUAGES.map(lang => ({ value: lang, label: lang }))
            ]}
            hint="Target specific languages (optional)"
          />
        </div>
      </CardContent>
    </Card>
  )
}
