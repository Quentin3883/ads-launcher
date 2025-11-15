// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Maximize2, Minimize2, Rocket, Loader2, Settings, ArrowLeft, ArrowRight } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { useClientsStore } from '@/lib/store/clients'
import { ClientSelectionStep } from '../bulk-launcher/steps/client-selection-step'
import { AdAccountSelectionStep } from '../bulk-launcher/steps/ad-account-selection-step'
import { UndoRedoControls } from '../bulk-launcher/controls/undo-redo-controls'
import { SidebarNavigation } from '../bulk-launcher/ui'
import type { SidebarSection } from '../bulk-launcher/ui'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isValidUrl } from '@/lib/validation/url'
import {
  AccountsPixelSection,
  CampaignStrategySection,
  RedirectionSection,
  BudgetSection,
  ScheduleSection,
  AudienceTargetingSection,
  PlacementSection,
  GeolocationSection,
  OptimizationSection,
  CreativesSection,
  SummarySection,
} from '../bulk-launcher/subsections'

interface BulkLauncherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editLaunchId?: string | null
}

export function BulkLauncherModal({ open, onOpenChange, editLaunchId }: BulkLauncherModalProps) {
  const {
    reset,
    clientId,
    setClientId,
    launchCallback,
    mode,
    setMode,
    campaign,
    launchMode,
    adAccountId,
    currentStep,
    setCurrentStep,
    facebookPageId,
    instagramAccountId,
    facebookPixelId,
    bulkAudiences,
    bulkCreatives,
  } = useBulkLauncher()
  const { selectedClientId } = useClientsStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [activeSection, setActiveSection] = useState('campaign')
  const [canScrollToNextSection, setCanScrollToNextSection] = useState(true)
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set())

  // Refs for scroll sections (only for main content sections)
  const campaignRef = useRef<HTMLDivElement>(null)
  const audiencesRef = useRef<HTMLDivElement>(null)
  const creativesRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch Naming Conventions
  const { data: namingConventions } = trpc.facebookCampaigns.getNamingConventions.useQuery()
  const { data: defaultConvention } = trpc.facebookCampaigns.getDefaultNamingConvention.useQuery()

  // Selected naming convention
  const [selectedConventionId, setSelectedConventionId] = useState<string>('')

  // Set default convention when loaded
  useEffect(() => {
    if (defaultConvention && !selectedConventionId) {
      setSelectedConventionId(defaultConvention.id)
    }
  }, [defaultConvention, selectedConventionId])

  // Generate campaign name preview
  const selectedConvention = namingConventions?.find((c: any) => c.id === selectedConventionId)
  const campaignNamePreview = selectedConvention?.template || 'Configure a naming convention in Settings to see preview'

  // Set edit mode when editing
  useEffect(() => {
    if (open && editLaunchId) {
      setMode('edit')
      // TODO [Feature]: Implement edit mode - fetch campaign data from Supabase and pre-fill store
    } else if (open && !editLaunchId) {
      setMode('create')
    }
  }, [open, editLaunchId, setMode])

  // Check if client is already selected
  const hasPreselectedClient = !!selectedClientId

  // Calculate step indices (Express mode removed, skip mode selection)
  const STEP_CLIENT = hasPreselectedClient ? -1 : 0 // Skip if preselected
  const STEP_AD_ACCOUNT = hasPreselectedClient ? 0 : 1
  const STEP_MAIN_CONTENT = hasPreselectedClient ? 1 : 2 // When to show single-page view

  // Initialize when modal opens
  useEffect(() => {
    if (open) {
      // Force Pro mode (Express mode removed)
      const { setLaunchMode } = useBulkLauncher.getState()
      setLaunchMode('pro')

      // Set client from global selection when modal opens
      if (selectedClientId && !clientId) {
        setClientId(selectedClientId)
      }
      setCurrentStep(0) // Start at step 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    if (currentStep > 0) {
      if (confirm('Are you sure? All progress will be lost.')) {
        reset()
        onOpenChange(false)
      }
    } else {
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
  }, [open, currentStep])

  const handleNext = () => {
    // Mark current setup step as visited when moving to next
    if (currentStep === STEP_CLIENT) {
      setVisitedSections(prev => new Set([...prev, 'client']))
    } else if (currentStep === STEP_AD_ACCOUNT) {
      setVisitedSections(prev => new Set([...prev, 'ad-account']))
    }
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

  // All granular sections in order
  const allSections = [
    'accounts-pixel',
    'campaign-strategy',
    'redirection',
    'budget',
    'schedule',
    'audience-targeting',
    'placement',
    'geolocation',
    'optimization',
    'creatives',
    'summary',
  ]

  // Get next/previous sections for navigation
  const getNextSection = (currentSectionId: string) => {
    const currentIndex = allSections.indexOf(currentSectionId)
    if (currentIndex === -1 || currentIndex === allSections.length - 1) return null

    const nextSection = allSections[currentIndex + 1]
    return unlockedSections.includes(nextSection) ? nextSection : null
  }

  const getPreviousSection = (currentSectionId: string) => {
    const currentIndex = allSections.indexOf(currentSectionId)
    if (currentIndex <= 0) return null
    return allSections[currentIndex - 1]
  }

  // Navigate to section (change active section or step)
  const navigateToSection = (sectionId: string) => {
    // Mark section as visited
    setVisitedSections(prev => new Set([...prev, sectionId]))

    // Handle navigation to initial setup steps
    if (sectionId === 'client' && !hasPreselectedClient) {
      setCurrentStep(STEP_CLIENT)
      return
    }
    if (sectionId === 'ad-account') {
      setCurrentStep(STEP_AD_ACCOUNT)
      return
    }

    // Handle navigation to main content sections
    if (allSections.includes(sectionId)) {
      setActiveSection(sectionId)
    }
  }

  // Helper: Get current destination type (with backward compatibility)
  const getCurrentDestination = () => {
    if (campaign.destinationType) return campaign.destinationType
    // Map old redirectionType to new destinationType
    const map: Record<string, string> = {
      'LANDING_PAGE': 'WEBSITE',
      'LEAD_FORM': 'ON_AD',
      'DEEPLINK': 'APP',
    }
    return campaign.redirectionType ? map[campaign.redirectionType] : undefined
  }

  // Subsection completion validation (Meta Ads v24 ODAX)
  const sectionCompletion = {
    'accounts-pixel': !!(facebookPageId && instagramAccountId), // Pixel is optional, validated separately
    'campaign-strategy': !!campaign.objective,
    // Redirection: depends on destination type and objective (Meta Ads v24 ODAX rules)
    'redirection': (() => {
      const dest = getCurrentDestination()
      const obj = campaign.type

      // WEBSITE destination requires VALID URL (for catalog sales)
      if (dest === 'WEBSITE') return isValidUrl(campaign.redirectionUrl)

      // ON_AD (lead form) requires form ID
      if (dest === 'ON_AD') return !!campaign.redirectionFormId

      // NONE destination (default - URL goes in creative):
      // - For Awareness: URL optional (but must be valid if provided)
      // - For Traffic, Engagement, Leads, Sales: VALID URL REQUIRED
      // - For AppPromotion: URL not needed
      if (dest === 'NONE' || !dest) {
        // AppPromotion doesn't require URL
        if (obj === 'AppPromotion') {
          return true
        }
        // Awareness: URL optional but must be valid if provided
        if (obj === 'Awareness') {
          return !campaign.redirectionUrl || isValidUrl(campaign.redirectionUrl)
        }
        // Traffic, Engagement, Leads, Sales REQUIRE VALID URL
        if (['Traffic', 'Engagement', 'Leads', 'Sales'].includes(obj || '')) {
          return isValidUrl(campaign.redirectionUrl)
        }
        return false
      }

      // Other destinations (MESSENGER, etc.)
      return !!dest
    })(),
    'budget': !!(campaign.budgetMode && (campaign.budgetMode === 'CBO' ? campaign.budget : bulkAudiences.budgetPerAdSet)),
    'schedule': !!campaign.startDate,
    'audience-targeting': !!(bulkAudiences.audiences && bulkAudiences.audiences.length > 0),
    'placement': !!(bulkAudiences.placementPresets && bulkAudiences.placementPresets.length > 0),
    'geolocation': !!(bulkAudiences.geoLocations && ((bulkAudiences.geoLocations.countries?.length ?? 0) > 0 || (bulkAudiences.geoLocations.regions?.length ?? 0) > 0 || (bulkAudiences.geoLocations.cities?.length ?? 0) > 0)),
    'optimization': !!bulkAudiences.optimizationEvent,
    'creatives': !!(bulkCreatives.creatives && bulkCreatives.creatives.length > 0),
    'summary': false, // Not checked until everything is ready
  }

  const isSectionComplete = (sectionId: string) => {
    return sectionCompletion[sectionId as keyof typeof sectionCompletion] || false
  }

  // Define sidebar sections (ALL steps including initial setup)
  // Only show checkmark if section has been visited AND completed
  const sidebarSections: SidebarSection[] = [
    ...(!hasPreselectedClient
      ? [
          {
            id: 'client',
            title: 'Select Client',
            isComplete: visitedSections.has('client') && !!clientId,
          },
        ]
      : []),
    {
      id: 'mode',
      title: 'Launch Mode',
      isComplete: visitedSections.has('mode') && !!launchMode,
    },
    {
      id: 'ad-account',
      title: 'Facebook Ad Account',
      isComplete: visitedSections.has('ad-account') && !!adAccountId,
    },
    // Granular subsections as main sections
    {
      id: 'accounts-pixel',
      title: 'Accounts & Pages',
      isComplete: visitedSections.has('accounts-pixel') && isSectionComplete('accounts-pixel'),
    },
    {
      id: 'campaign-strategy',
      title: 'Campaign Strategy',
      isComplete: visitedSections.has('campaign-strategy') && isSectionComplete('campaign-strategy'),
    },
    {
      id: 'redirection',
      title: 'Redirection & URL',
      isComplete: visitedSections.has('redirection') && isSectionComplete('redirection'),
    },
    {
      id: 'budget',
      title: 'Budget',
      isComplete: visitedSections.has('budget') && isSectionComplete('budget'),
    },
    {
      id: 'schedule',
      title: 'Schedule',
      isComplete: visitedSections.has('schedule') && isSectionComplete('schedule'),
    },
    {
      id: 'audience-targeting',
      title: 'Audience',
      isComplete: visitedSections.has('audience-targeting') && isSectionComplete('audience-targeting'),
    },
    {
      id: 'placement',
      title: 'Placement & Demographics',
      isComplete: visitedSections.has('placement') && isSectionComplete('placement'),
    },
    {
      id: 'geolocation',
      title: 'Geolocation',
      isComplete: visitedSections.has('geolocation') && isSectionComplete('geolocation'),
    },
    {
      id: 'optimization',
      title: 'Optimization Goal',
      isComplete: visitedSections.has('optimization') && isSectionComplete('optimization'),
    },
    {
      id: 'creatives',
      title: 'Creative & Wording',
      isComplete: visitedSections.has('creatives') && isSectionComplete('creatives'),
    },
    {
      id: 'summary',
      title: 'Summary',
      isComplete: visitedSections.has('summary') && isSectionComplete('summary'),
    },
  ]

  // Determine which sections are unlocked (progressive unlocking)
  const unlockedSections: string[] = []

  // Initial setup sections
  if (!hasPreselectedClient) {
    unlockedSections.push('client')
    if (clientId) {
      unlockedSections.push('mode')
    }
  } else {
    unlockedSections.push('mode')
  }
  if (launchMode) {
    unlockedSections.push('ad-account')
  }

  // Progressive unlocking for granular sections
  if (adAccountId) {
    // Unlock each section progressively based on completion
    for (let i = 0; i < allSections.length; i++) {
      const sectionId = allSections[i]

      // First section is always unlocked
      if (i === 0) {
        unlockedSections.push(sectionId)
      } else {
        // Unlock next section if previous one is complete
        const previousSection = allSections[i - 1]
        if (isSectionComplete(previousSection)) {
          unlockedSections.push(sectionId)
        } else {
          // Stop unlocking if previous section not complete
          break
        }
      }
    }
  }

  // Determine if we're in the main content view (single page with sidebar)
  const isMainContentView = currentStep >= STEP_MAIN_CONTENT && launchMode === 'pro' && adAccountId

  // Set initial active section when entering main content view and mark as visited
  useEffect(() => {
    if (isMainContentView && activeSection !== 'accounts-pixel') {
      setActiveSection('accounts-pixel')
      setVisitedSections(prev => new Set([...prev, 'accounts-pixel']))
    }
  }, [isMainContentView])

  // Mark active section as visited when it changes
  useEffect(() => {
    if (isMainContentView && activeSection) {
      setVisitedSections(prev => new Set([...prev, activeSection]))
    }
  }, [activeSection, isMainContentView])

  // Auto-jump disabled for now - user navigates manually with Previous/Next buttons
  // useEffect(() => {
  //   if (!isMainContentView) return
  //   if (!allSections.includes(activeSection)) return
  //   if (isSectionComplete(activeSection)) {
  //     const timer = setTimeout(() => {
  //       const nextSection = getNextSection(activeSection)
  //       if (nextSection) navigateToSection(nextSection)
  //     }, 500)
  //     return () => clearTimeout(timer)
  //   }
  // }, [...])

  // Render initial setup steps (Express mode removed)
  const renderSetupStep = () => {
    if (currentStep === STEP_CLIENT && !hasPreselectedClient) return <ClientSelectionStep />
    if (currentStep === STEP_AD_ACCOUNT) return <AdAccountSelectionStep />
    return null
  }

  // Get step description
  const getStepDescription = () => {
    if (currentStep === STEP_CLIENT) return 'Select your client'
    if (currentStep === STEP_AD_ACCOUNT) return 'Select Facebook Ad Account'
    return ''
  }

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
            : 'max-w-7xl h-[90vh] rounded-xl animate-in zoom-in-95 duration-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Bulk Campaign Launcher
                </h2>
                {mode === 'edit' && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Edit Mode
                  </span>
                )}
              </div>
              {!isMainContentView && (
                <p className="text-sm text-muted-foreground mt-0.5">{getStepDescription()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMainContentView && <UndoRedoControls />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Naming Convention (only show in main content view) */}
        {isMainContentView && (
          <div className="border-b border-border bg-background px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-4 max-w-6xl mx-auto">
              <div className="flex items-center gap-3 flex-1">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Campaign Name:</label>
                <input
                  type="text"
                  value={campaign.name || ''}
                  onChange={(e) => {
                    const { updateCampaign } = useBulkLauncher.getState()
                    updateCampaign({ name: e.target.value })
                  }}
                  placeholder={campaignNamePreview}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm italic font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <a
                href="/settings?tab=naming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                title="Manage naming conventions"
              >
                <Settings className="h-4 w-4" />
                {selectedConvention?.name || 'Configure'}
              </a>
            </div>
          </div>
        )}

        {/* Main Content Area with Sidebar */}
        <div className="flex h-full min-h-0 flex-1 relative overflow-hidden">
          {/* Sidebar - Scrollable within modal */}
          <div className="w-64 flex-shrink-0 h-full overflow-y-auto border-r border-border bg-muted/20">
            <SidebarNavigation
              sections={sidebarSections}
              activeSection={
                currentStep === STEP_CLIENT ? 'client' :
                currentStep === STEP_AD_ACCOUNT ? 'ad-account' :
                activeSection
              }
              onSectionClick={navigateToSection}
              unlockedSections={unlockedSections}
            />
          </div>

          {/* Main Content */}
          {isMainContentView ? (
            // Show only active section (scrollable if content is long)
            <div className="flex-1 min-h-0 overflow-y-auto flex justify-center relative">
              <div className="w-full max-w-5xl py-6 px-6 flex items-center justify-center">
                <div className="w-full animate-in fade-in slide-in-from-right-4 duration-200">
                  {activeSection === 'accounts-pixel' && <AccountsPixelSection />}
                  {activeSection === 'campaign-strategy' && (
                    <CampaignStrategySection
                      onComplete={() => {
                        const nextSection = getNextSection('campaign-strategy')
                        if (nextSection) {
                          navigateToSection(nextSection)
                        }
                      }}
                    />
                  )}
                  {activeSection === 'redirection' && <RedirectionSection />}
                  {activeSection === 'budget' && <BudgetSection />}
                  {activeSection === 'schedule' && <ScheduleSection />}
                  {activeSection === 'audience-targeting' && <AudienceTargetingSection />}
                  {activeSection === 'placement' && <PlacementSection />}
                  {activeSection === 'geolocation' && <GeolocationSection />}
                  {activeSection === 'optimization' && <OptimizationSection />}
                  {activeSection === 'creatives' && <CreativesSection />}
                  {activeSection === 'summary' && <SummarySection />}
                </div>
              </div>
            </div>
          ) : (
            // Initial setup steps (separate pages with Next/Previous)
            <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-6">
              <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-4 duration-200">
                {renderSetupStep()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isMainContentView ? (
          // Navigation arrows and Launch button for main content
          <div className="flex-shrink-0 border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-end">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              {getPreviousSection(activeSection) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const prev = getPreviousSection(activeSection)
                    if (prev) navigateToSection(prev)
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}

              {/* Launch Button or Next Button */}
              {activeSection === 'summary' ? (
                <Button
                  onClick={handleLaunch}
                  disabled={!launchCallback || isLaunching}
                  className={cn("bg-green-600 hover:bg-green-700")}
                  size="lg"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5 mr-2" />
                      Launch to Facebook
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={!getNextSection(activeSection) || !isSectionComplete(activeSection)}
                  onClick={() => {
                    // Mark current section as visited and validated before moving
                    if (isSectionComplete(activeSection)) {
                      setVisitedSections(prev => new Set([...prev, activeSection]))
                    }
                    const next = getNextSection(activeSection)
                    if (next) navigateToSection(next)
                  }}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Next/Previous buttons for setup steps
          <div className="flex-shrink-0 border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEP_MAIN_CONTENT + 1}
            </div>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === STEP_CLIENT && !clientId) ||
                  (currentStep === STEP_AD_ACCOUNT && !adAccountId)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
