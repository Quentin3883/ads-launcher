'use client'

import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { ds } from './design-system'

export interface StyledSelectOption {
  value: string
  label: string
  badge?: string
  badgeColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'
  description?: string
  disabled?: boolean
}

export interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: StyledSelectOption[]
  placeholder?: string
  disabled?: boolean
  label?: string
  required?: boolean
  error?: string
  hint?: string
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  label,
  required = false,
  error,
  hint,
  autoFocus = false,
  onFocus,
  onBlur,
  className = '',
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  // Auto-focus if specified
  useEffect(() => {
    if (autoFocus && selectRef.current) {
      selectRef.current.focus()
    }
  }, [autoFocus])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    onBlur?.()
  }

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (!isOpen) {
        onFocus?.()
        const rect = e.currentTarget.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      } else {
        onBlur?.()
      }
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className={ds.cn(ds.spacing.vertical.xs, className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className={ds.componentPresets.label}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <div className="relative">
        <button
          ref={selectRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={ds.cn(
            'w-full',
            ds.spacing.paddingX.default,
            ds.spacing.paddingY.default,
            ds.borders.radius.md,
            'border bg-background text-left',
            'flex items-center justify-between',
            ds.spacing.gap.sm,
            ds.transitions.default,
            ds.typography.input,
            error
              ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
              : 'border-border hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            isOpen ? 'ring-2 ring-primary/20 border-primary' : ''
          )}
        >
          <div className={ds.cn('flex-1 flex items-center min-w-0', ds.spacing.gap.xs)}>
            {selectedOption ? (
              <>
                <span className={ds.cn(ds.typography.body, 'text-foreground truncate')}>
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span
                    className={ds.cn(
                      ds.componentPresets.badge,
                      'flex-shrink-0',
                      ds.getBadgeColor(selectedOption.badgeColor)
                    )}
                  >
                    {selectedOption.badge}
                  </span>
                )}
              </>
            ) : (
              <span className={ds.typography.placeholder}>{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={ds.cn(
              'h-4 w-4 text-muted-foreground flex-shrink-0',
              'transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={ds.cn(
              'fixed z-[9999] mt-1',
              'bg-popover border border-border',
              ds.borders.radius.md,
              ds.shadows.lg,
              'max-h-60 overflow-auto'
            )}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={ds.cn(
                  'w-full text-left',
                  ds.spacing.paddingX.default,
                  'py-2.5',
                  'flex items-center justify-between',
                  ds.spacing.gap.xs,
                  ds.transitions.default,
                  option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer',
                  option.value === value && 'bg-accent/50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className={ds.cn(ds.typography.body, 'text-foreground truncate')}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className={ds.cn(ds.typography.caption, 'mt-0.5 truncate')}>
                      {option.description}
                    </div>
                  )}
                </div>
                {option.badge && (
                  <span
                    className={ds.cn(
                      ds.componentPresets.badge,
                      'flex-shrink-0',
                      ds.getBadgeColor(option.badgeColor)
                    )}
                  >
                    {option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hint or Error */}
      {(hint || error) && (
        <p className={ds.cn(ds.typography.caption, error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
