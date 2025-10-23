'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CampaignConfigStep } from './bulk-launcher/campaign-config-step'
import { AudiencesBulkStep } from './bulk-launcher/audiences-bulk-step'
import { CreativesBulkStep } from './bulk-launcher/creatives-bulk-step'
import { MatrixGenerationStep } from './bulk-launcher/matrix-generation-step'

interface BulkLauncherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  { id: 1, name: 'Campaign', description: 'Configure campaign settings' },
  { id: 2, name: 'Audiences', description: 'Select multiple audiences & placements' },
  { id: 3, name: 'Creatives', description: 'Upload creatives & define copy' },
  { id: 4, name: 'Generate', description: 'Review matrix and generate' },
]

export function BulkLauncherModal({ open, onOpenChange }: BulkLauncherModalProps) {
  const { currentStep, setCurrentStep, reset } = useBulkLauncher()

  const handleClose = () => {
    if (confirm('Are you sure? All progress will be lost.')) {
      reset()
      onOpenChange(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-xl bg-card shadow-2xl border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Bulk Campaign Launcher</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-center max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-3 transition-all ${
                    step.id <= currentStep ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all ${
                      currentStep > step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium whitespace-nowrap ${
                        currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.name}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className="mx-4 w-16 h-0.5 bg-border flex-shrink-0">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentStep > step.id ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && <CampaignConfigStep />}
              {currentStep === 2 && <AudiencesBulkStep />}
              {currentStep === 3 && <CreativesBulkStep />}
              {currentStep === 4 && <MatrixGenerationStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {currentStep < 4 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
