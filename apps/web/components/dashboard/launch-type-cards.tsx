'use client'

import { FileText, Globe, ArrowRight, FileQuestion } from 'lucide-react'

const launchTypes = [
  {
    id: 'lead-form',
    name: 'Lead Form',
    description: 'Collect leads directly on the platform',
    icon: FileText,
    color: 'from-primary-400 to-primary-600',
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Drive traffic to your custom landing page',
    icon: Globe,
    color: 'from-violet-400 to-purple-600',
  },
  {
    id: 'redirect',
    name: 'Redirect',
    description: 'Send users to any external URL',
    icon: ArrowRight,
    color: 'from-indigo-400 to-blue-600',
  },
  {
    id: 'survey',
    name: 'Survey',
    description: 'Gather insights with custom surveys',
    icon: FileQuestion,
    color: 'from-fuchsia-400 to-pink-600',
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
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 transition-opacity group-hover:opacity-5`} />

            {/* Content */}
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1.5 font-display text-base font-semibold">
                {type.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {type.description}
              </p>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-6 right-6 translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
