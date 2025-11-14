'use client'

import { Card as ShadcnCard, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function Card({ title, description, children, className, icon }: CardProps) {
  return (
    <ShadcnCard className={cn(className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={!title && !description ? 'pt-6' : ''}>
        {children}
      </CardContent>
    </ShadcnCard>
  )
}
