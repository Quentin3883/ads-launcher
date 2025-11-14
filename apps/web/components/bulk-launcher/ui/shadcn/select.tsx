'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  label?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  label,
  required = false,
  error,
  hint,
  className = '',
}: SelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* Select */}
      <ShadcnSelect value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn(error && 'border-destructive focus:ring-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>

      {/* Hint or Error */}
      {(hint || error) && (
        <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
