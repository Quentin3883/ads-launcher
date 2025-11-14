'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { ds } from './design-system'

export interface SubPage {
  id: string
  title: string
  isComplete?: boolean
}

interface SubPageNavigationProps {
  subPages: SubPage[]
  currentSubPage: number
  onSubPageChange: (index: number) => void
  onNext?: () => void
  onPrevious?: () => void
  showNavButtons?: boolean
}

export function SubPageNavigation({
  subPages,
  currentSubPage,
  onSubPageChange,
  onNext,
  onPrevious,
  showNavButtons = true,
}: SubPageNavigationProps) {
  const canGoNext = currentSubPage < subPages.length - 1
  const canGoPrevious = currentSubPage > 0

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/50 px-6 py-3">
      {/* Left: Previous button or spacer */}
      <div className="w-24">
        {showNavButtons && canGoPrevious && (
          <Button variant="ghost"
            onClick={onPrevious}
            className={ds.cn(
              'flex items-center gap-1',
              ds.typography.caption,
              'text-muted-foreground hover:text-foreground',
              ds.transitions.default
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        )}
      </div>

      {/* Center: Sub-page dots */}
      <div className="flex items-center gap-2">
        {subPages.map((subPage, index) => (
          <Button variant="ghost"
            key={subPage.id}
            onClick={() => onSubPageChange(index)}
            className={ds.cn(
              'group relative',
              ds.transitions.default
            )}
            title={subPage.title}
          >
            {/* Dot */}
            <div
              className={ds.cn(
                'h-2 w-2 rounded-full transition-all',
                currentSubPage === index
                  ? 'bg-primary scale-125'
                  : subPage.isComplete
                  ? 'bg-primary/50 hover:bg-primary/70'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-border">
              {subPage.title}
            </div>
          </Button>
        ))}
      </div>

      {/* Right: Next button or spacer */}
      <div className="w-24 flex justify-end">
        {showNavButtons && canGoNext && (
          <Button variant="ghost"
            onClick={onNext}
            className={ds.cn(
              'flex items-center gap-1',
              ds.typography.caption,
              'text-muted-foreground hover:text-foreground',
              ds.transitions.default
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
