'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface StyledInputProps {
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

export const StyledInput = forwardRef<HTMLInputElement, StyledInputProps>(
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
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Forward ref
    useEffect(() => {
      if (ref && 'current' in ref) {
        ;(ref as any).current = inputRef.current
      }
    }, [ref])

    const handleFocus = () => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = () => {
      setIsFocused(false)
      onBlur?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnter) {
        e.preventDefault()
        onEnter()
      }
    }

    const inputType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div
          className={`
            relative flex items-center
            rounded-lg border bg-background
            transition-all duration-200
            ${error
              ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20'
              : isFocused
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
            }
            ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* Icon */}
          {icon && <div className="pl-3 text-muted-foreground">{icon}</div>}

          {/* Prefix */}
          {prefix && <div className="pl-3 text-sm text-muted-foreground">{prefix}</div>}

          {/* Input */}
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            className={`
              flex-1 px-4 py-2.5 bg-transparent
              text-foreground placeholder:text-muted-foreground
              focus:outline-none
              disabled:cursor-not-allowed
              ${prefix || icon ? 'pl-0' : ''}
              ${suffix || type === 'password' ? 'pr-0' : ''}
              ${inputClassName}
            `}
          />

          {/* Suffix */}
          {suffix && <div className="pr-3 text-sm text-muted-foreground">{suffix}</div>}

          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-3 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Hint or Error */}
        {(hint || error) && (
          <p className={`text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)

StyledInput.displayName = 'StyledInput'
