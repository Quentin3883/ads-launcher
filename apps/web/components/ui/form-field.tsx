import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  maxLength?: number
  min?: number
  max?: number
  className?: string
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  min,
  max,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {maxLength && ` (${maxLength})`}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
      />
    </div>
  )
}
