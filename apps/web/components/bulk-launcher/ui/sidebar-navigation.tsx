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
  return (
    <div className="h-full flex flex-col py-6 px-4">
      <div className="flex-1 space-y-1">
        {sections.map((section, index) => {
          const isActive = section.id === activeSection
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)
          const isLastSection = index === sections.length - 1

          return (
            <div key={section.id} className="relative">
              {/* Vertical connecting line */}
              {!isLastSection && (
                <div
                  className={ds.cn(
                    "absolute left-[19px] top-10 bottom-0 w-[2px]",
                    section.isComplete ? "bg-primary" : "bg-gray-200"
                  )}
                />
              )}

              {/* Step item */}
              <button
                onClick={() => !isLocked && onSectionClick(section.id)}
                disabled={isLocked}
                className={ds.cn(
                  "w-full flex items-start gap-3 py-2 px-2 rounded-lg transition-all relative z-10",
                  isActive && "bg-primary/5",
                  isLocked && "opacity-40 cursor-not-allowed",
                  !isLocked && !isActive && "hover:bg-gray-50"
                )}
              >
                {/* Circle with number or checkmark */}
                <div className={ds.cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                  section.isComplete
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                )}>
                  {section.isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Title only (no subtitle) */}
                <div className="flex-1 text-left pt-2">
                  <div className={ds.cn(
                    "font-medium text-sm transition-colors",
                    isActive ? "text-primary" : section.isComplete ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {section.title}
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
