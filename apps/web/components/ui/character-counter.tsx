import { cn } from '@launcher-ads/ui'

interface CharacterCounterProps {
  current: number
  recommended?: number
  maximum?: number
  className?: string
}

export function CharacterCounter({ current, recommended, maximum, className }: CharacterCounterProps) {
  // Determine status
  let status: 'normal' | 'warning' | 'exceeded' | 'optimal' = 'normal'
  let message = ''

  if (maximum && current > maximum) {
    status = 'exceeded'
    message = `${current - maximum} caractères au-dessus de la limite`
  } else if (recommended && current > recommended) {
    status = 'warning'
    message = `${current - recommended} caractères au-dessus de la recommandation`
  } else if (recommended && current <= recommended) {
    status = 'optimal'
    message = 'Longueur optimale'
  }

  return (
    <div className={cn('flex items-center justify-between text-xs', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn('font-medium', {
            'text-muted-foreground': status === 'normal',
            'text-green-600': status === 'optimal',
            'text-yellow-600': status === 'warning',
            'text-red-600': status === 'exceeded',
          })}
        >
          {current} / {maximum || recommended || '∞'}
        </span>

        {recommended && !maximum && (
          <span className="text-muted-foreground">(recommandé: {recommended})</span>
        )}
      </div>

      {message && (
        <span
          className={cn('text-xs', {
            'text-green-600': status === 'optimal',
            'text-yellow-600': status === 'warning',
            'text-red-600': status === 'exceeded',
          })}
        >
          {message}
        </span>
      )}
    </div>
  )
}

interface CharacterCounterInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  recommended?: number
  maximum?: number
  placeholder?: string
  multiline?: boolean
  rows?: number
}

export function CharacterCounterInput({
  value,
  onChange,
  label,
  recommended,
  maximum,
  placeholder,
  multiline = false,
  rows = 3,
}: CharacterCounterInputProps) {
  const current = value.length

  const inputClasses = cn(
    'w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm',
    {
      'border-border focus:border-primary': !maximum || current <= maximum,
      'border-red-500 focus:border-red-500 focus:ring-red-200': maximum && current > maximum,
    }
  )

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maximum}
          className={cn(inputClasses, 'resize-none')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maximum}
          className={inputClasses}
        />
      )}

      <CharacterCounter current={current} recommended={recommended} maximum={maximum} />
    </div>
  )
}
