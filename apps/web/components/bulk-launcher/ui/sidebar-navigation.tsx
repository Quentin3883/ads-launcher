'use client'

import { Check } from 'lucide-react'
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
  return (
    <div className="h-full flex flex-col py-6 px-4">
      <div className="flex-1 flex flex-col gap-0">
        {sections.map((section, index) => {
          const isActive = section.id === activeSection
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)
          const isCompleted = section.isComplete
          const isLastSection = index === sections.length - 1

          return (
            <div key={section.id} className="flex items-start">
              {/* Left column: circle + line */}
              <div className="flex flex-col items-center mr-3">
                {/* Circle */}
                <div
                  className={ds.cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && !isCompleted && "bg-white text-primary ring-2 ring-primary ring-offset-2",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Vertical line */}
                {!isLastSection && (
                  <div
                    className={ds.cn(
                      "w-0.5 h-6",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Right column: title button */}
              <button
                onClick={() => !isLocked && onSectionClick(section.id)}
                disabled={isLocked}
                className={ds.cn(
                  "flex-1 text-left py-1 px-2 -ml-2 rounded-lg transition-all",
                  isActive && "bg-primary/5",
                  isLocked && "opacity-40 cursor-not-allowed",
                  !isLocked && !isActive && "hover:bg-gray-50"
                )}
              >
                <span
                  className={ds.cn(
                    "text-sm font-medium",
                    isActive && "text-primary",
                    !isActive && isCompleted && "text-foreground",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {section.title}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
