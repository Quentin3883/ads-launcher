'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { forwardRef, SelectHTMLAttributes, useState, useRef, useEffect } from 'react'
import { cn } from './utils'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  placeholder?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  onCreateNew?: () => void
  createNewLabel?: string
  variant?: 'default' | 'warning'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    options,
    placeholder = 'Select an option',
    onChange,
    onValueChange,
    onCreateNew,
    createNewLabel = 'Create new',
    value,
    className,
    variant = 'default',
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value || '')
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedValue(value || '')
    }, [value])

    useEffect(() => {
      if (isOpen && containerRef.current && dropdownRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const dropdownHeight = dropdownRef.current.scrollHeight
        const spaceBelow = window.innerHeight - containerRect.bottom
        const spaceAbove = containerRect.top

        // If not enough space below but more space above, show on top
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition('top')
        } else {
          setDropdownPosition('bottom')
        }
      }
    }, [isOpen])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === selectedValue)

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue)
      setIsOpen(false)
      onChange?.(optionValue)
      onValueChange?.(optionValue)
    }

    const handleCreateNew = () => {
      setIsOpen(false)
      onCreateNew?.()
    }

    const variantStyles = {
      default: 'border-[#d9d8ce] focus:ring-blue-500',
      warning: 'border-orange-300 focus:ring-orange-500',
    }

    return (
      <div ref={containerRef} className="relative">
        {/* Hidden native select for form compatibility */}
        <select
          ref={ref}
          value={selectedValue}
          onChange={(e) => handleSelect(e.target.value)}
          className="sr-only"
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white text-left flex items-center justify-between gap-2 min-w-[120px]',
            variantStyles[variant],
            className
          )}
        >
          <span className={cn(
            'flex-1 truncate',
            !selectedOption && 'text-gray-400'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 text-gray-400 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'fixed z-[9999] bg-white border border-[#d9d8ce] rounded-lg shadow-lg max-h-60 overflow-auto',
              dropdownPosition === 'bottom' ? 'mt-1' : 'mb-1'
            )}
            style={{
              width: containerRef.current?.offsetWidth,
              left: containerRef.current?.getBoundingClientRect().left,
              [dropdownPosition === 'bottom' ? 'top' : 'bottom']:
                dropdownPosition === 'bottom'
                  ? containerRef.current?.getBoundingClientRect().bottom
                  : window.innerHeight - (containerRef.current?.getBoundingClientRect().top || 0)
            }}
          >
            {/* Empty option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 text-gray-400 border-b border-gray-100"
            >
              {placeholder}
            </button>

            {/* Regular options */}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors flex items-center gap-2',
                  selectedValue === option.value && 'bg-blue-50 text-blue-700 font-medium'
                )}
              >
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            ))}

            {/* Create new option */}
            {onCreateNew && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                {createNewLabel}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
