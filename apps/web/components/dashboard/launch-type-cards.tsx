'use client'

import { FileText, Globe, ArrowRight, FileQuestion } from 'lucide-react'

const launchTypes = [
  {
    id: 'lead-form',
    name: 'Lead Form',
    description: 'Collect leads directly on the platform',
    icon: FileText,
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Drive traffic to your custom landing page',
    icon: Globe,
  },
  {
    id: 'redirect',
    name: 'Redirect',
    description: 'Send users to any external URL',
    icon: ArrowRight,
  },
  {
    id: 'survey',
    name: 'Survey',
    description: 'Gather insights with custom surveys',
    icon: FileQuestion,
  },
]

export function LaunchTypeCards({
  onSelect,
}: {
  onSelect: (type: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {launchTypes.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className="group relative rounded-xl bg-white/60 backdrop-blur-md border border-white/20 p-5 text-left transition-all hover:border-primary/30 hover:bg-white/80"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-display text-base font-semibold text-foreground">
              {type.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {type.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}
