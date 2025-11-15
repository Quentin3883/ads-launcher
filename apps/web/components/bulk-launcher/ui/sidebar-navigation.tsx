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
      <div className="flex-1 flex flex-col">
        {sections.map((section, index) => {
          const isActive = section.id === activeSection
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)
          const isCompleted = section.isComplete
          const isLastSection = index === sections.length - 1

          // Determine state
          const state = isCompleted ? 'completed' : isActive ? 'active' : 'inactive'

          return (
            <div key={section.id} className="group/step flex items-center" data-state={state}>
              {/* Indicator + Separator column */}
              <div className="flex flex-col items-center mr-3">
                {/* Circle Indicator */}
                <div
                  className={ds.cn(
                    "relative flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    state === 'completed' && "bg-primary text-white",
                    state === 'active' && "bg-white text-primary ring-2 ring-primary ring-offset-2",
                    state === 'inactive' && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Vertical Separator Line */}
                {!isLastSection && (
                  <div
                    className={ds.cn(
                      "w-0.5 h-4 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Content */}
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
                <div
                  className={ds.cn(
                    "font-medium text-sm transition-colors",
                    isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {section.title}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
