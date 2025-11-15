'use client'

import { ds } from './design-system'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'

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
  // Find active step index (0-based for internal logic, but we'll use 1-based for display)
  const activeStepIndex = sections.findIndex((s) => s.id === activeSection)

  return (
    <div className="h-full flex flex-col py-6 px-4">
      <Stepper
        value={activeStepIndex}
        orientation="vertical"
        className="flex-1 w-full"
      >
        {sections.map((section, index) => {
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)
          const isLastSection = index === sections.length - 1

          return (
            <StepperItem
              key={section.id}
              step={index + 1}
              completed={section.isComplete}
              disabled={isLocked}
              className="relative items-start [&:not(:last-child)]:pb-2"
            >
              <StepperTrigger
                asChild
                className={ds.cn(
                  "w-full cursor-pointer",
                  !isLocked && "hover:bg-gray-50",
                  activeStepIndex === index && "bg-primary/5"
                )}
              >
                <div
                  onClick={() => !isLocked && onSectionClick(section.id)}
                  className="flex items-center gap-3 py-1 px-2 rounded-lg transition-all"
                >
                  <StepperIndicator className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-2 data-[state=active]:bg-white data-[state=active]:text-primary" />
                  <StepperTitle
                    className={ds.cn(
                      "mt-0 text-sm font-medium",
                      activeStepIndex === index && "text-primary",
                      section.isComplete && activeStepIndex !== index && "text-foreground",
                      !section.isComplete && activeStepIndex !== index && "text-muted-foreground"
                    )}
                  >
                    {section.title}
                  </StepperTitle>
                </div>
              </StepperTrigger>
              {!isLastSection && (
                <StepperSeparator className="absolute inset-y-0 left-[11px] top-[calc(1.5rem+0.5rem)] -order-1 m-0 -translate-x-1/2 h-[calc(100%-2rem)] w-0.5 flex-none" />
              )}
            </StepperItem>
          )
        })}
      </Stepper>
    </div>
  )
}
