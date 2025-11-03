import { cn } from '@launcher-ads/ui'

interface ToggleButtonGroupProps {
  label?: string
  items: string[]
  selectedItems: string[]
  onToggle: (item: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function ToggleButtonGroup({
  label,
  items,
  selectedItems,
  onToggle,
  size = 'md',
  className,
}: ToggleButtonGroupProps) {
  const buttonClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-foreground mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={cn(
              buttonClasses,
              'rounded-full transition-all',
              selectedItems.includes(item)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
