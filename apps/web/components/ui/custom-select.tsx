'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-2 py-1.5 text-sm border rounded-lg
          flex items-center justify-between gap-2
          transition-all
          ${disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white hover:border-[#151515] cursor-pointer border-[#d9d8ce]'
          }
          ${isOpen ? 'ring-1 ring-[#151515] border-[#151515]' : ''}
        `}
      >
        <span className="flex items-center gap-2 flex-1 text-left truncate">
          {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-1
            bg-white border border-[#d9d8ce] rounded-lg shadow-lg
            max-h-60 overflow-y-auto
            animate-in fade-in slide-in-from-top-2 duration-150
          "
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-3 py-2 text-sm text-left
                  flex items-center justify-between gap-2
                  transition-colors
                  ${isSelected
                    ? 'bg-[#edece5] text-[#151515] font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  first:rounded-t-lg last:rounded-b-lg
                `}
              >
                <span className="flex items-center gap-2 flex-1">
                  {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                  <span>{option.label}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 text-[#151515] flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
