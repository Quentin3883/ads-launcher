'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

import { ChevronDown, Info } from 'lucide-react'

export interface FormSectionProps {
  title?: string
  description?: string
  hint?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onToggle?: () => void
  icon?: ReactNode
  badge?: string
  badgeColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  className?: string
  contentClassName?: string
  variant?: 'default' | 'compact' | 'card'
  headerContent?: ReactNode
}

const badgeColorClasses = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function FormSection({
  title,
  description,
  hint,
  children,
  collapsible = false,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onToggle,
  icon,
  badge,
  badgeColor = 'blue',
  className = '',
  contentClassName = '',
  variant = 'default',
  headerContent,
}: FormSectionProps) {
  const isControlled = controlledExpanded !== undefined
  const isExpanded = isControlled ? controlledExpanded : defaultExpanded

  const handleToggle = () => {
    if (collapsible && onToggle) {
      onToggle()
    }
  }

  const variantClasses = {
    default: 'space-y-4',
    compact: 'space-y-3',
    card: 'rounded-lg border border-border bg-card p-4 space-y-4',
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {/* Header */}
      {(title || description || hint || headerContent) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              {icon && <div className="text-muted-foreground">{icon}</div>}
              <h3
                className={`text-base font-semibold text-foreground ${
                  collapsible ? 'cursor-pointer select-none' : ''
                }`}
                onClick={handleToggle}
              >
                {title}
              </h3>
              {badge && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColorClasses[badgeColor]}`}
                >
                  {badge}
                </span>
              )}
              {headerContent && <div className="ml-auto">{headerContent}</div>}
              {collapsible && (
                <Button variant="ghost"
                  type="button"
                  onClick={handleToggle}
                  className="ml-auto p-1 hover:bg-accent rounded transition-colors"
                >
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isExpanded ? '' : '-rotate-90'
                    }`}
                  />
                </Button>
              )}
            </div>
          )}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {hint && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isExpanded && <div className={contentClassName}>{children}</div>}
    </div>
  )
}

export interface FormRowProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FormRow({ children, columns = 2, gap = 'md', className = '' }: FormRowProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>{children}</div>
}
