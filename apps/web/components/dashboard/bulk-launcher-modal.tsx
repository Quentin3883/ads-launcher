'use client'

import { useEffect, useState } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Maximize2, Minimize2, Rocket, Loader2 } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useClientsStore } from '@/lib/store/clients'
import { ClientSelectionStep } from '../bulk-launcher/steps/client-selection-step'
import { AdAccountSelectionStep } from '../bulk-launcher/steps/ad-account-selection-step'
import { ModeSelectionStep } from '../bulk-launcher/steps/mode-selection-step'
import { ExpressObjectiveStep } from '../bulk-launcher/steps/express/express-objective-step'
import { ExpressCreativeStep } from '../bulk-launcher/steps/express/express-creative-step'
import { CampaignConfigStep } from '../bulk-launcher/steps/campaign-config-step'
import { AudiencesBulkStep } from '../bulk-launcher/steps/audiences-bulk-step'
import { CreativesBulkStep } from '../bulk-launcher/steps/creatives-bulk-step'
import { MatrixGenerationStep } from '../bulk-launcher/steps/matrix-generation-step'
import { UndoRedoControls } from '../bulk-launcher/controls/undo-redo-controls'

interface BulkLauncherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editLaunchId?: string | null
}

// Define steps for Express Mode (2 screens)
const expressSteps = [
  { id: 1, name: 'Objectif & Cible', description: 'Objectif et ciblage de votre campagne' },
  { id: 2, name: 'Créa & Lancement', description: 'Visuels et textes de la publicité' },
]

// Define steps for Pro Mode (4 steps)
const proSteps = [
  { id: 1, name: 'Compte & Stratégie', description: 'Configuration du compte et stratégie' },
  { id: 2, name: 'Audiences & Geo', description: 'Audiences et ciblage géographique' },
  { id: 3, name: 'Créatifs & Copies', description: 'Visuels et copies publicitaires' },
  { id: 4, name: 'Budget & Génération', description: 'Budget et génération de campagne' },
]

/**
 * FLOW STRUCTURE:
 *
 * If client already selected globally (selectedClientId exists):
 *   Step 0: Ad Account Selection
 *   Step 1: Mode Selection (Express or Pro)
 *   Step 2+: Mode-specific steps (Express: 2 steps, Pro: 4 steps)
 *
 * If no client selected globally:
 *   Step 0: Client Selection
 *   Step 1: Ad Account Selection
 *   Step 2: Mode Selection (Express or Pro)
 *   Step 3+: Mode-specific steps (Express: 2 steps, Pro: 4 steps)
 */

export function BulkLauncherModal({ open, onOpenChange, editLaunchId }: BulkLauncherModalProps) {
  const { currentStep, setCurrentStep, reset, clientId, setClientId, launchMode, launchCallback, mode, setMode } = useBulkLauncher()
  const { selectedClientId } = useClientsStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)

  // Set edit mode when editing
  useEffect(() => {
    if (open && editLaunchId) {
      setMode('edit')
      // TODO: Fetch campaign data and pre-fill store
    } else if (open && !editLaunchId) {
      setMode('create')
    }
  }, [open, editLaunchId, setMode])

  // Check if client is already selected
  const hasPreselectedClient = !!selectedClientId

  // Calculate key step indices based on flow
  const STEP_AD_ACCOUNT = hasPreselectedClient ? 0 : 1
  const STEP_MODE_SELECTION = hasPreselectedClient ? 1 : 2
  const STEP_FIRST_MODE = hasPreselectedClient ? 2 : 3

  // Get mode steps
  const modeSteps = launchMode === 'express' ? expressSteps : launchMode === 'pro' ? proSteps : []

  // Initialize when modal opens
  useEffect(() => {
    if (open) {
      // Set client from global selection when modal opens
      if (selectedClientId && !clientId) {
        setClientId(selectedClientId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Reset to initial step when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0) // Always start at step 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    // Only confirm if user has made progress past mode selection
    if (currentStep > STEP_MODE_SELECTION && launchMode) {
      if (confirm('Are you sure? All progress will be lost.')) {
        reset()
        onOpenChange(false)
      }
    } else {
      // No progress yet, close immediately
      reset()
      onOpenChange(false)
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStep, launchMode])

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLaunch = async () => {
    if (launchCallback) {
      setIsLaunching(true)
      try {
        await launchCallback()
      } finally {
        setIsLaunching(false)
      }
    }
  }

  // Render the correct step component
  const renderStep = () => {
    // PRE-MODE STEPS (before mode selection)
    if (!hasPreselectedClient) {
      // Flow: Client (0) → Ad Account (1) → Mode (2) → Mode steps (3+)
      if (currentStep === 0) return <ClientSelectionStep />
      if (currentStep === 1) return <AdAccountSelectionStep />
      if (currentStep === 2) return <ModeSelectionStep />
    } else {
      // Flow: Ad Account (0) → Mode (1) → Mode steps (2+)
      if (currentStep === 0) return <AdAccountSelectionStep />
      if (currentStep === 1) return <ModeSelectionStep />
    }

    // MODE-SPECIFIC STEPS (after mode selection)
    if (currentStep >= STEP_FIRST_MODE) {
      const modeStepIndex = currentStep - STEP_FIRST_MODE // 0-based index within the mode

      if (launchMode === 'express') {
        if (modeStepIndex === 0) return <ExpressObjectiveStep />
        if (modeStepIndex === 1) return <ExpressCreativeStep />
      }

      if (launchMode === 'pro') {
        if (modeStepIndex === 0) return <CampaignConfigStep />
        if (modeStepIndex === 1) return <AudiencesBulkStep />
        if (modeStepIndex === 2) return <CreativesBulkStep />
        if (modeStepIndex === 3) return <MatrixGenerationStep />
      }
    }

    return null
  }

  // Get header description
  const getHeaderDescription = () => {
    if (currentStep < STEP_MODE_SELECTION) {
      if (currentStep === 0 && !hasPreselectedClient) return 'Sélectionnez votre client'
      if (currentStep === STEP_AD_ACCOUNT) return 'Sélectionnez le compte publicitaire'
    }

    if (currentStep === STEP_MODE_SELECTION) {
      return 'Choisissez votre mode de lancement'
    }

    // Mode steps
    if (currentStep >= STEP_FIRST_MODE && modeSteps.length > 0) {
      const modeStepIndex = currentStep - STEP_FIRST_MODE
      return modeSteps[modeStepIndex]?.description || ''
    }

    return ''
  }

  // Calculate display step for progress bar (1-based, within mode steps only)
  const displayModeStep = currentStep >= STEP_FIRST_MODE ? currentStep - STEP_FIRST_MODE + 1 : 0

  // Check if we're on the last step
  const isLastStep = displayModeStep === modeSteps.length

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 ${isFullscreen ? 'p-0' : 'p-4'}`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full flex flex-col bg-card shadow-2xl border border-border transition-all duration-300 ${
          isFullscreen
            ? 'h-full rounded-none'
            : 'max-w-6xl max-h-[90vh] rounded-xl animate-in zoom-in-95 duration-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {launchMode === 'express' ? 'Mode Express' : launchMode === 'pro' ? 'Mode Pro' : 'Bulk Campaign Launcher'}
                </h2>
                {mode === 'edit' && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Edit Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getHeaderDescription()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {launchMode && currentStep >= STEP_FIRST_MODE && <UndoRedoControls />}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps - Only show when in mode steps */}
        {launchMode && currentStep >= STEP_FIRST_MODE && modeSteps.length > 0 && (
          <div className="border-b border-border bg-background px-6 py-4">
            <div className="flex items-center justify-center max-w-4xl mx-auto">
              {modeSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => step.id <= displayModeStep && setCurrentStep(STEP_FIRST_MODE + step.id - 1)}
                    disabled={step.id > displayModeStep}
                    className={`flex items-center gap-3 transition-all ${
                      step.id <= displayModeStep ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all ${
                        displayModeStep > step.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : displayModeStep === step.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      {displayModeStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-medium whitespace-nowrap ${
                          displayModeStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.name}
                      </div>
                    </div>
                  </button>
                  {index < modeSteps.length - 1 && (
                    <div className="mx-4 w-16 h-0.5 bg-border flex-shrink-0">
                      <div
                        className={`h-full transition-all duration-300 ${
                          displayModeStep > step.id ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div key={currentStep} className="animate-in fade-in slide-in-from-right-4 duration-200">
            {renderStep()}
          </div>
        </div>

        {/* Footer - Only show when in mode steps */}
        {launchMode && currentStep >= STEP_FIRST_MODE && (
          <div className="flex-shrink-0 border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step {displayModeStep} of {modeSteps.length}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > STEP_FIRST_MODE && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {!isLastStep ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleLaunch}
                  disabled={!launchCallback || isLaunching}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Lancement en cours...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Launch to Facebook
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
