import { FormSection, Input, ds, Button } from '../ui/shadcn'
import type { BudgetMode } from '@launcher-ads/sdk'

interface BudgetSelectorProps {
  budgetMode: BudgetMode
  budgetType: 'daily' | 'lifetime'
  budget?: number
  adSetsCount: number
  budgetPerAdSet?: number
  onUpdateBudgetMode: (mode: BudgetMode) => void
  onUpdateBudgetType: (type: 'daily' | 'lifetime') => void
  onUpdateBudget: (budget?: number) => void
}

/**
 * Budget selector with CBO/ABO toggle and budget inputs
 */
export function BudgetSelector({
  budgetMode,
  budgetType,
  budget,
  adSetsCount,
  budgetPerAdSet,
  onUpdateBudgetMode,
  onUpdateBudgetType,
  onUpdateBudget,
}: BudgetSelectorProps) {
  const aboTotalBudget = budgetMode === 'ABO' ? adSetsCount * (budgetPerAdSet || 0) : 0

  return (
    <FormSection title="Budget">
      {/* Budget Mode */}
      <div className={ds.spacing.vertical.sm}>
        <label className={ds.componentPresets.label}>Budget Mode</label>
        <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
          <Button
            type="button"
            onClick={() => onUpdateBudgetMode('CBO')}
            variant={budgetMode === 'CBO' ? 'default' : 'outline'}
            className={ds.cn(
              ds.spacing.paddingX.default,
              'py-3.5',
              ds.borders.radius.md,
              'border-2',
              ds.transitions.default,
              'text-left justify-start h-auto'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <div className={ds.cn(ds.typography.body, 'font-semibold')}>Campaign Budget</div>
                <div className={ds.cn(ds.typography.caption, 'mt-0.5')}>Budget at campaign level</div>
              </div>
              {budgetMode === 'CBO' && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0"></div>
              )}
            </div>
          </Button>
          <Button
            type="button"
            onClick={() => onUpdateBudgetMode('ABO')}
            variant={budgetMode === 'ABO' ? 'default' : 'outline'}
            className={ds.cn(
              ds.spacing.paddingX.default,
              'py-3.5',
              ds.borders.radius.md,
              'border-2',
              ds.transitions.default,
              'text-left justify-start h-auto'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <div className={ds.cn(ds.typography.body, 'font-semibold')}>Ad Set Budget</div>
                <div className={ds.cn(ds.typography.caption, 'mt-0.5')}>Budget per Ad Set</div>
              </div>
              {budgetMode === 'ABO' && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0"></div>
              )}
            </div>
          </Button>
        </div>
      </div>

      {budgetMode === 'CBO' && (
        <>
          {/* Budget Type Toggle */}
          <div className={ds.spacing.vertical.sm}>
            <label className={ds.componentPresets.label}>Budget Amount (€)</label>
            <div className={ds.cn('flex items-center', ds.spacing.gap.xs)}>
              <Button
                type="button"
                onClick={() => onUpdateBudgetType('daily')}
                variant={budgetType === 'daily' ? 'default' : 'secondary'}
                className={ds.cn(
                  ds.spacing.paddingX.default,
                  'py-2',
                  ds.borders.radius.md,
                  ds.typography.body,
                  'font-medium',
                  ds.transitions.default
                )}
              >
                Daily
              </Button>
              <Button
                type="button"
                onClick={() => onUpdateBudgetType('lifetime')}
                variant={budgetType === 'lifetime' ? 'default' : 'secondary'}
                className={ds.cn(
                  ds.spacing.paddingX.default,
                  'py-2',
                  ds.borders.radius.md,
                  ds.typography.body,
                  'font-medium',
                  ds.transitions.default
                )}
              >
                Lifetime
              </Button>
            </div>
            <Input
              value={budget || ''}
              onChange={(value) => onUpdateBudget(parseFloat(value) || undefined)}
              type="number"
              prefix="€"
              placeholder={budgetType === 'daily' ? '50' : '1500'}
            />
          </div>
        </>
      )}

      {/* ABO Budget Display */}
      {budgetMode === 'ABO' && (
        <div className={ds.cn(ds.borders.radius.md, 'bg-muted/30 border border-border', ds.spacing.padding.md)}>
          <p className={ds.cn(ds.typography.caption, 'mb-2')}>
            Le budget sera défini au niveau de chaque Ad Set
          </p>
          {adSetsCount > 0 && (
            <p className={ds.cn(ds.typography.body, 'font-medium')}>
              {adSetsCount} Ad Sets × €{budgetPerAdSet || 0} = €{aboTotalBudget} total
            </p>
          )}
        </div>
      )}
    </FormSection>
  )
}
