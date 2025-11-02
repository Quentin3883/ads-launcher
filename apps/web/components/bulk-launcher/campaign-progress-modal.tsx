'use client'

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  detail?: string
  error?: string
}

interface CampaignProgressModalProps {
  open: boolean
  steps: ProgressStep[]
  onClose?: () => void
}

export function CampaignProgressModal({ open, steps, onClose }: CampaignProgressModalProps) {
  if (!open) return null

  const allCompleted = steps.every((s) => s.status === 'completed')
  const hasError = steps.some((s) => s.status === 'error')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold text-foreground">
            {hasError ? 'Campaign Creation Failed' : allCompleted ? 'Campaign Created Successfully' : 'Creating Campaign...'}
          </h2>
          {(allCompleted || hasError) && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : step.status === 'error' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : step.status === 'in_progress' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                </div>
                <p className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-foreground' :
                  step.status === 'error' ? 'text-destructive' :
                  step.status === 'in_progress' ? 'text-primary' :
                  'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
                )}
                {step.error && (
                  <p className="text-xs text-destructive mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {!hasError && !allCompleted && (
          <div className="px-6 pb-6">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{
                  width: `${(steps.filter((s) => s.status === 'completed').length / steps.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {steps.filter((s) => s.status === 'completed').length} of {steps.length} steps completed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
