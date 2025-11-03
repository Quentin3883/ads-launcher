import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@launcher-ads/ui'

interface SectionCardProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  headerAction?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  headerAction,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  )
}
