'use client'

import { Zap, Target, Sparkles } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'

export function ModeSelectionStep() {
  const { setLaunchMode, setCurrentStep, currentStep } = useBulkLauncher()

  const handleSelectMode = (mode: 'express' | 'pro' | 'custom') => {
    if (mode === 'custom') {
      // Coming soon - do nothing
      return
    }

    setLaunchMode(mode)
    // Move to next step (first mode step)
    setCurrentStep(currentStep + 1)
  }

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Choose Your Launch Mode</h2>
          <p className="text-muted-foreground">
            Select the workflow that best fits your needs
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Express Mode */}
          <button
            onClick={() => handleSelectMode('express')}
            className="group relative p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 transition-colors">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Express Mode</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Quick campaign launch in <span className="font-semibold text-foreground">3 steps</span>
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Simple targeting
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Fast setup
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Perfect for speed
                </div>
              </div>

              <div className="text-xs font-medium text-primary group-hover:text-primary/80">
                Select →
              </div>
            </div>
          </button>

          {/* Pro Mode */}
          <button
            onClick={() => handleSelectMode('pro')}
            className="group relative p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Pro Mode</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Advanced targeting in <span className="font-semibold text-foreground">4 steps</span>
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Strategy presets
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Advanced targeting
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Matrix generation
                </div>
              </div>

              <div className="text-xs font-medium text-primary group-hover:text-primary/80">
                Select →
              </div>
            </div>
          </button>

          {/* Custom Strategy Mode */}
          <div className="group relative p-6 rounded-xl border-2 border-dashed border-border bg-muted/30 opacity-60 cursor-not-allowed text-left">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Custom Strategy</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4 flex-1">
                AI-powered strategy builder
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  AI recommendations
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Smart optimization
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Guided setup
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium w-fit">
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            You can switch modes later from the settings
          </p>
        </div>
      </div>
    </div>
  )
}
