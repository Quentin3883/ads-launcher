import { Button, Select, FormRow, ds } from '../ui/shadcn'
import { LANGUAGES } from '@launcher-ads/sdk'

interface DemographicsFormProps {
  ageMin: number
  ageMax: number
  gender: 'All' | 'Male' | 'Female'
  languages: string[]
  onUpdateAge: (min: number, max: number) => void
  onUpdateGender: (gender: 'All' | 'Male' | 'Female') => void
  onUpdateLanguages: (languages: string[]) => void
}

/**
 * Demographics form with age range slider, gender selection, and languages
 * Includes a dual-handle age slider with visual labels
 */
export function DemographicsForm({
  ageMin,
  ageMax,
  gender,
  languages,
  onUpdateAge,
  onUpdateGender,
  onUpdateLanguages,
}: DemographicsFormProps) {
  return (
    <div className={ds.spacing.vertical.md}>
      {/* Age Range and Gender */}
      <FormRow columns={2} gap="lg">
        {/* Age Range Slider - Dual Handle */}
        <div>
          <label className={ds.componentPresets.label}>Age Range</label>
          <div className="relative h-10 flex items-center mt-3">
            {/* Age labels above handles */}
            <div
              className={ds.cn(
                'absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm',
                ds.typography.caption,
                'font-medium'
              )}
              style={{
                left: `calc(${((ageMin - 13) / (65 - 13)) * 100}% - 12px)`,
                transition: 'left 0.05s ease-out',
              }}
            >
              {ageMin}
            </div>
            <div
              className={ds.cn(
                'absolute -top-3 px-2 py-0.5 bg-primary text-primary-foreground rounded shadow-sm',
                ds.typography.caption,
                'font-medium'
              )}
              style={{
                left: `calc(${((ageMax - 13) / (65 - 13)) * 100}% - 12px)`,
                transition: 'left 0.05s ease-out',
              }}
            >
              {ageMax === 65 ? '65+' : ageMax}
            </div>

            {/* Track */}
            <div className="absolute w-full h-1.5 bg-muted rounded-full"></div>

            {/* Active track between handles */}
            <div
              className="absolute h-1.5 bg-primary rounded-full"
              style={{
                left: `${((ageMin - 13) / (65 - 13)) * 100}%`,
                right: `${100 - ((ageMax - 13) / (65 - 13)) * 100}%`,
                transition: 'left 0.05s ease-out, right 0.05s ease-out',
              }}
            ></div>

            {/* Min handle */}
            <input
              type="range"
              min={13}
              max={65}
              value={ageMin}
              onChange={(e) => onUpdateAge(Math.min(Number(e.target.value), ageMax - 1), ageMax)}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
            />

            {/* Max handle */}
            <input
              type="range"
              min={13}
              max={65}
              value={ageMax}
              onChange={(e) => onUpdateAge(ageMin, Math.max(Number(e.target.value), ageMin + 1))}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
            />
          </div>
        </div>

        {/* Gender Selection (Pills) */}
        <div>
          <label className={ds.componentPresets.label}>Gender</label>
          <div className={ds.cn('flex flex-wrap mt-2', ds.spacing.gap.sm)}>
            {(['All', 'Male', 'Female'] as const).map((genderOption) => (
              <Button
                key={genderOption}
                onClick={() => onUpdateGender(genderOption)}
                variant={gender === genderOption ? 'default' : 'secondary'}
                className={ds.cn('px-4 py-2 rounded-full font-medium transition-all', ds.typography.body)}
              >
                {genderOption}
              </Button>
            ))}
          </div>
        </div>
      </FormRow>

      {/* Languages Dropdown */}
      <div>
        <Select
          label="Languages (optional)"
          value={(languages || [])[0] || ''}
          onChange={(val) => onUpdateLanguages(val ? [val] : [])}
          options={[
            { value: '', label: 'No language targeting' },
            ...LANGUAGES.map((lang) => ({ value: lang, label: lang })),
          ]}
          hint="Target specific languages (optional)"
        />
      </div>
    </div>
  )
}
