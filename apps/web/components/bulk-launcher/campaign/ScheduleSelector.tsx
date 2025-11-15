import { FormSection, ds, Button } from '../ui/shadcn'

interface ScheduleSelectorProps {
  startDate: string
  startTime?: string
  endDate?: string
  endTime?: string
  budgetMode: 'CBO' | 'ABO'
  budgetType: 'daily' | 'lifetime'
  budget?: number
  onUpdateStartDate: (date: string) => void
  onUpdateStartTime: (time?: string) => void
  onUpdateEndDate: (date?: string) => void
  onUpdateEndTime: (time?: string) => void
}

/**
 * Schedule selector with start/end date and time
 * Includes budget calculations for lifetime campaigns
 */
export function ScheduleSelector({
  startDate,
  startTime,
  endDate,
  endTime,
  budgetMode,
  budgetType,
  budget,
  onUpdateStartDate,
  onUpdateStartTime,
  onUpdateEndDate,
  onUpdateEndTime,
}: ScheduleSelectorProps) {
  return (
    <FormSection title="Schedule">
      <div className={ds.spacing.vertical.md}>
        <div className={ds.spacing.vertical.sm}>
          <label className={ds.componentPresets.label}>Do you want to schedule your campaign?</label>
          <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
            <Button
              type="button"
              onClick={() => {
                onUpdateStartDate('NOW')
                onUpdateStartTime(undefined)
              }}
              variant={startDate === 'NOW' ? 'default' : 'secondary'}
              className={ds.cn(
                ds.spacing.paddingX.default,
                'py-2',
                ds.borders.radius.md,
                ds.typography.body,
                'font-medium',
                ds.transitions.default
              )}
            >
              No - Start Now
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (startDate === 'NOW') {
                  const today = new Date().toISOString().split('T')[0] || ''
                  onUpdateStartDate(today)
                  onUpdateStartTime('12:00')
                }
              }}
              variant={startDate !== 'NOW' ? 'default' : 'secondary'}
              className={ds.cn(
                ds.spacing.paddingX.default,
                'py-2',
                ds.borders.radius.md,
                ds.typography.body,
                'font-medium',
                ds.transitions.default
              )}
            >
              Yes - Schedule
            </Button>
          </div>
          {startDate !== 'NOW' && (
            <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onUpdateStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={ds.cn(ds.componentPresets.input, 'flex-1')}
              />
              <input
                type="time"
                value={startTime || '12:00'}
                onChange={(e) => onUpdateStartTime(e.target.value)}
                className={ds.cn(ds.componentPresets.input, 'w-28')}
              />
            </div>
          )}
        </div>

        <div className={ds.spacing.vertical.sm}>
          <div className="flex items-center justify-between">
            <label className={ds.componentPresets.label}>End Date</label>
            {endDate && (
              <Button
                type="button"
                onClick={() => {
                  onUpdateEndDate(undefined)
                  onUpdateEndTime(undefined)
                }}
                variant="link"
                className={ds.cn(ds.typography.caption, 'h-auto p-0')}
              >
                Clear
              </Button>
            )}
          </div>
          <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onUpdateEndDate(e.target.value)}
              min={startDate !== 'NOW' ? startDate : new Date().toISOString().split('T')[0]}
              placeholder="Optional"
              className={ds.cn(ds.componentPresets.input, 'flex-1')}
            />
            {endDate && (
              <input
                type="time"
                value={endTime || '12:00'}
                onChange={(e) => onUpdateEndTime(e.target.value)}
                className={ds.cn(ds.componentPresets.input, 'w-28')}
              />
            )}
          </div>
        </div>

        {/* Calculation Display */}
        {budgetMode === 'CBO' &&
          budget &&
          startDate &&
          endDate &&
          (() => {
            const start = new Date(startDate)
            const end = new Date(endDate)
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

            if (days <= 0) return null

            const dailyEstimate = budgetType === 'lifetime' ? (budget / days).toFixed(2) : null
            const lifetimeEstimate = budgetType === 'daily' ? (budget * days).toFixed(2) : null

            return (
              <div
                className={ds.cn(
                  ds.borders.radius.md,
                  'bg-primary/5 border border-primary/20',
                  ds.spacing.padding.md
                )}
              >
                <div className={ds.cn('flex items-center justify-between', ds.typography.body)}>
                  <span className="text-muted-foreground font-medium">
                    {days} jour{days > 1 ? 's' : ''}
                  </span>
                  {budgetType === 'lifetime' && dailyEstimate && (
                    <span className="font-semibold text-primary">≈ €{dailyEstimate}/jour</span>
                  )}
                  {budgetType === 'daily' && lifetimeEstimate && (
                    <span className="font-semibold text-primary">≈ €{lifetimeEstimate} total</span>
                  )}
                </div>
              </div>
            )
          })()}
      </div>
    </FormSection>
  )
}
