'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

import { Check, ChevronRight } from 'lucide-react'
import { ds } from './design-system'

export interface SidebarSection {
  id: string
  title: string
  isComplete?: boolean
  icon?: React.ReactNode
  subsections?: {
    id: string
    title: string
    isComplete?: boolean
  }[]
}

interface SidebarNavigationProps {
  sections: SidebarSection[]
  activeSection: string
  onSectionClick: (sectionId: string) => void
  unlockedSections?: string[] // IDs of sections that are unlocked
}

export function SidebarNavigation({
  sections,
  activeSection,
  onSectionClick,
  unlockedSections = [],
}: SidebarNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Auto-expand active section
  useEffect(() => {
    const activeMainSection = sections.find(
      (s) => s.id === activeSection || s.subsections?.some((sub) => sub.id === activeSection)
    )
    if (activeMainSection) {
      setExpandedSections((prev) => new Set([...prev, activeMainSection.id]))
    }
  }, [activeSection, sections])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 flex-1">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const isActiveMain = section.id === activeSection
          const hasActiveSubsection = section.subsections?.some((sub) => sub.id === activeSection)
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)

          const sectionIndex = sections.indexOf(section)
          const previousSection = sectionIndex > 0 ? sections[sectionIndex - 1] : null
          const showConnectingLine = previousSection?.isComplete && section.isComplete

          return (
            <div key={section.id} className="mb-0.5 relative">
              {/* Connecting line from previous completed section */}
              {showConnectingLine && (
                <div className="absolute left-[14px] -top-1 w-0.5 h-2 bg-primary z-0" />
              )}

              {/* Main Section */}
              <Button variant="ghost"
                onClick={() => {
                  if (isLocked) return
                  if (section.subsections && section.subsections.length > 0) {
                    toggleSection(section.id)
                  } else {
                    onSectionClick(section.id)
                  }
                }}
                disabled={isLocked}
                className={ds.cn(
                  'w-full flex items-center gap-2 h-8 relative',
                  'px-2.5',
                  'py-1',
                  ds.borders.radius.md,
                  ds.transitions.default,
                  'group',
                  isLocked
                    ? 'text-muted-foreground/40 cursor-not-allowed opacity-50'
                    : isActiveMain || hasActiveSubsection
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {/* Icon or Completion indicator */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative z-10">
                  {section.isComplete ? (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : section.icon ? (
                    section.icon
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>

                {/* Title */}
                <span className="text-sm flex-1 text-left truncate">
                  {section.title}
                </span>

                {/* Expand indicator */}
                {section.subsections && section.subsections.length > 0 && (
                  <ChevronRight
                    className={ds.cn(
                      'w-4 h-4 flex-shrink-0 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                )}
              </Button>

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && isExpanded && (
                <div className="ml-6 mt-0.5 space-y-0">
                  {section.subsections.map((subsection) => {
                    const isActiveSubsection = subsection.id === activeSection

                    return (
                      <Button variant="ghost"
                        key={subsection.id}
                        onClick={() => onSectionClick(subsection.id)}
                        className={ds.cn(
                          'w-full flex items-center gap-1.5',
                          'px-2 py-1.5',
                          ds.borders.radius.sm,
                          ds.transitions.default,
                          'text-xs',
                          isActiveSubsection
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {/* Completion indicator */}
                        <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
                          {subsection.isComplete ? (
                            <div className="w-1 h-1 rounded-full bg-primary" />
                          ) : (
                            <div className="w-1 h-1 rounded-full border border-muted-foreground/30" />
                          )}
                        </div>

                        {/* Title */}
                        <span className="flex-1 text-left truncate">{subsection.title}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
