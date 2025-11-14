'use client'

import { forwardRef } from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface InputProps {
  value: string | number
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  onEnter?: () => void
  type?: 'text' | 'email' | 'password' | 'url' | 'number' | 'tel'
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  label?: string
  required?: boolean
  error?: string
  hint?: string
  autoFocus?: boolean
  autoComplete?: string
  min?: number
  max?: number
  step?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  icon?: React.ReactNode
  className?: string
  inputClassName?: string
  maxLength?: number
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      onFocus,
      onEnter,
      type = 'text',
      placeholder,
      disabled = false,
      readOnly = false,
      label,
      required = false,
      error,
      hint,
      autoFocus = false,
      autoComplete,
      min,
      max,
      step,
      prefix,
      suffix,
      icon,
      className = '',
      inputClassName = '',
      maxLength,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        {label && (
          <Label>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        {/* Input Container */}
        <div className="relative flex items-center">
          {/* Icon */}
          {icon && <div className="absolute left-3 text-muted-foreground pointer-events-none">{icon}</div>}

          {/* Prefix */}
          {prefix && <div className="absolute left-3 text-sm text-muted-foreground pointer-events-none">{prefix}</div>}

          {/* Input */}
          <ShadcnInput
            ref={ref}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault()
                onEnter()
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              (prefix || icon) && 'pl-10',
              (suffix || type === 'password') && 'pr-10',
              inputClassName
            )}
          />

          {/* Suffix */}
          {suffix && <div className="absolute right-3 text-sm text-muted-foreground pointer-events-none">{suffix}</div>}

          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Hint or Error */}
        {(hint || error) && (
          <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
