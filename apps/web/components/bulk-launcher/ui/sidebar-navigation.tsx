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
  // Find the active step index
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
          const isLastSection = index === sections.length - 1

          return (
            <StepperItem
              key={section.id}
              step={index + 1}
              completed={section.isComplete}
              disabled={isLocked}
              className="relative items-center [&:not(:last-child)]:pb-0"
            >
              <StepperTrigger
                className={ds.cn(
                  "items-center w-full",
                  activeStepIndex === index && "bg-primary/5 rounded-lg -ml-2 pl-2",
                  !isLocked && activeStepIndex !== index && "hover:bg-gray-50 rounded-lg -ml-2 pl-2"
                )}
                onClick={() => !isLocked && onSectionClick(section.id)}
              >
                <StepperIndicator className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-2" />
                <StepperTitle className="mt-0 px-2 text-left">
                  {section.title}
                </StepperTitle>
              </StepperTrigger>
              {!isLastSection && (
                <StepperSeparator className="absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 h-4 flex-none" />
              )}
            </StepperItem>
          )
        })}
      </Stepper>
    </div>
  )
}
