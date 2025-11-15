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
        className="flex-1"
      >
        {sections.map((section, index) => {
          const isLocked = unlockedSections.length > 0 && !unlockedSections.includes(section.id)

          return (
            <StepperItem
              key={section.id}
              step={index + 1}
              completed={section.isComplete}
              disabled={isLocked}
              className="relative items-start [&:not(:last-child)]:flex-1"
            >
              <StepperTrigger
                className={ds.cn(
                  "items-start pb-6 last:pb-0",
                  activeStepIndex === index && "bg-primary/5 rounded-lg px-2 -ml-2",
                  !isLocked && activeStepIndex !== index && "hover:bg-gray-50 rounded-lg px-2 -ml-2"
                )}
                onClick={() => !isLocked && onSectionClick(section.id)}
              >
                <StepperIndicator className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-2 data-[state=active]:bg-white data-[state=active]:text-primary" />
                <div className="mt-0 space-y-0 px-2 text-left">
                  <StepperTitle
                    className={ds.cn(
                      activeStepIndex === index && "text-primary",
                      section.isComplete && activeStepIndex !== index && "text-foreground",
                      !section.isComplete && activeStepIndex !== index && "text-muted-foreground"
                    )}
                  >
                    {section.title}
                  </StepperTitle>
                </div>
              </StepperTrigger>
              {index < sections.length - 1 && (
                <StepperSeparator className="absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
              )}
            </StepperItem>
          )
        })}
      </Stepper>
    </div>
  )
}
