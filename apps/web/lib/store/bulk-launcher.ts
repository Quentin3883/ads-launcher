import { create } from 'zustand'
import type {
  CampaignConfig,
  BulkAudiencesConfig,
  BulkCreativesConfig,
  MatrixConfig,
  MatrixDimensions,
  AudiencePreset,
  Creative,
  CopyVariant,
  BulkCampaignOutput,
  GeneratedAdSet,
  PlacementPreset,
} from '@launcher-ads/sdk'
import {
  generateAdSetsFromMatrix,
  calculateMatrixStats,
  getDefaultRedirectionType,
  autoCompleteCampaignConfig,
} from '@launcher-ads/sdk'

interface HistoryState {
  audiences: AudiencePreset[]
  creatives: Creative[]
  copyVariants: CopyVariant[]
}

// Edit Mode Types
export interface FacebookCampaign {
  id: string
  name: string
  objective: string
  status: string
  budget?: number
  [key: string]: any
}

export interface FacebookAdSet {
  id: string
  name: string
  campaignId: string
  status: string
  targeting: any
  budget?: number
  [key: string]: any
}

export interface FacebookAd {
  id: string
  name: string
  adSetId: string
  creative: any
  [key: string]: any
}

export interface EditContext {
  campaignId?: string
  adSetIds?: string[]
  sourceData?: {
    campaign?: FacebookCampaign
    adSets?: FacebookAdSet[]
    ads?: FacebookAd[]
  }
}

export interface EditStrategy {
  keepExistingCreatives: boolean
  keepExistingAudiences: boolean
  duplicateMode: 'reference' | 'copy'
}

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  detail?: string
  error?: string
}

export interface UploadProgress {
  id: string
  fileName: string
  type: 'video' | 'image'
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  phase?: string
  error?: string
}

export interface BulkLauncherState {
  // Launch mode
  launchMode: 'express' | 'pro' | 'custom' | null
  setLaunchMode: (mode: 'express' | 'pro' | 'custom' | null) => void

  // Edit Mode
  mode: 'create' | 'edit' | null
  setMode: (mode: 'create' | 'edit' | null) => void
  editContext: EditContext | null
  setEditContext: (context: EditContext | null) => void
  editStrategy: EditStrategy
  setEditStrategy: (strategy: Partial<EditStrategy>) => void

  // Current step
  currentStep: number
  setCurrentStep: (step: number) => void

  // Client selection
  clientId: string | null
  setClientId: (clientId: string | null) => void

  // Ad Account selection
  adAccountId: string | null
  setAdAccountId: (adAccountId: string | null) => void

  // Facebook Page selection
  facebookPageId: string | null
  setFacebookPageId: (pageId: string | null) => void

  // Instagram Account selection
  instagramAccountId: string | null
  setInstagramAccountId: (instagramAccountId: string | null) => void

  // Facebook Pixel selection
  facebookPixelId: string | null
  setFacebookPixelId: (pixelId: string | null) => void

  // Express Mode - Simple fields
  campaignObjective: string | null
  setCampaignObjective: (objective: string | null) => void
  geoTargeting: any
  setGeoTargeting: (geo: any) => void
  placementPreset: string | null
  setPlacementPreset: (preset: string | null) => void
  audiencePreset: string | null
  setAudiencePreset: (preset: string | null) => void
  adCreatives: any[]
  setAdCreatives: (creatives: any[]) => void
  adCopy: { primaryText?: string; headline?: string; description?: string }
  setAdCopy: (copy: any) => void

  // Step 1: Campaign
  campaign: Partial<CampaignConfig>
  updateCampaign: (data: Partial<CampaignConfig>) => void

  // Step 2: Bulk Audiences
  bulkAudiences: BulkAudiencesConfig
  updateBulkAudiences: (data: Partial<BulkAudiencesConfig>) => void
  addAudience: (audience: AudiencePreset) => void
  removeAudience: (id: string) => void
  togglePlacementPreset: (preset: PlacementPreset) => void

  // Step 3: Bulk Creatives
  bulkCreatives: BulkCreativesConfig
  updateBulkCreatives: (data: Partial<BulkCreativesConfig>) => void
  addCreative: (creative: Creative) => void
  removeCreative: (id: string) => void
  updateCreative: (id: string, data: Partial<Creative>) => void
  updateCreativeCopy: (id: string, copy: { headline: string; primaryText: string; cta: string }) => void
  addCopyVariant: (variant: CopyVariant) => void
  removeCopyVariant: (id: string) => void

  // Step 4: Matrix
  matrixConfig: MatrixConfig
  updateMatrixConfig: (data: Partial<MatrixConfig>) => void
  toggleDimension: (dimension: keyof MatrixDimensions) => void

  // Generation
  generatedAdSets: GeneratedAdSet[]
  generateCampaign: () => BulkCampaignOutput | null
  getMatrixStats: () => { adSets: number; adsPerAdSet: number; totalAds: number }

  // Undo/Redo
  history: {
    past: HistoryState[]
    future: HistoryState[]
  }
  canUndo: () => boolean
  canRedo: () => boolean
  undo: () => void
  redo: () => void

  // Progress tracking
  progressSteps: ProgressStep[]
  showProgress: boolean
  setProgressSteps: (steps: ProgressStep[]) => void
  updateProgressStep: (id: string, update: Partial<ProgressStep>) => void
  setShowProgress: (show: boolean) => void

  // Upload progress tracking
  uploadProgress: UploadProgress[]
  setUploadProgress: (uploads: UploadProgress[]) => void
  updateUploadProgress: (id: string, update: Partial<UploadProgress>) => void
  addUploadProgress: (upload: UploadProgress) => void

  // Launch callback
  launchCallback: (() => Promise<void>) | null
  setLaunchCallback: (callback: (() => Promise<void>) | null) => void

  // Actions
  reset: () => void
}

const initialCampaign: Partial<CampaignConfig> = {
  name: 'Test Campaign',
  type: 'Traffic',
  objective: '',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: 'https://test.io',
  budgetMode: 'CBO',
  budgetType: 'daily',
  budget: 1000,
  startDate: 'NOW',
  startTime: undefined,
  urlParamsOverride: 'visuel={{ad.name}}&site_source_name={{site_source_name}}&placement={{placement}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}&utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{adset.name}}',
  urlTags: 'visuel={{ad.name}}&site_source_name={{site_source_name}}&placement={{placement}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}&utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{adset.name}}', // Facebook url_tags for UTM tracking at creative level
}

const initialBulkAudiences: BulkAudiencesConfig = {
  audiences: [],
  placementPresets: ['ALL_PLACEMENTS'],
  customPlacements: [],
  geoLocations: {
    countries: ['US'],
    regions: [],
    cities: [],
  },
  demographics: {
    ageMin: 18,
    ageMax: 65,
    gender: 'All',
    languages: [],
  },
  optimizationEvent: 'LINK_CLICK',
  budgetPerAdSet: 50,
  budgetType: 'daily',
}

const initialBulkCreatives: BulkCreativesConfig = {
  creatives: [],
  sameCopyForAll: true,
  globalHeadline: '',
  globalPrimaryText: '',
  globalCTA: 'Learn More',
  creativeCopies: {},
  enableVariants: false,
  copyVariants: [],
}

const initialMatrixConfig: MatrixConfig = {
  dimensions: {
    audiences: false, // Disabled by default - not useful for adset generation
    placements: false,
    creatives: false,
    formatVariants: false, // Feed + Story variants - disabled by default, uses asset customization instead
    formatSplit: false, // Split by Image vs Video - disabled by default
    copyVariants: false,
  },
  softLimit: 300,
}

const MAX_HISTORY_SIZE = 50

const initialEditStrategy: EditStrategy = {
  keepExistingCreatives: false,
  keepExistingAudiences: false,
  duplicateMode: 'reference',
}

// Helper to save current state to history
const saveToHistory = (state: BulkLauncherState): HistoryState => ({
  audiences: [...state.bulkAudiences.audiences],
  creatives: [...state.bulkCreatives.creatives],
  copyVariants: [...(state.bulkCreatives.copyVariants || [])],
})

// Helper to restore state from history
const restoreFromHistory = (historyState: HistoryState, currentState: BulkLauncherState) => {
  return {
    bulkAudiences: {
      ...currentState.bulkAudiences,
      audiences: historyState.audiences,
    },
    bulkCreatives: {
      ...currentState.bulkCreatives,
      creatives: historyState.creatives,
      copyVariants: historyState.copyVariants,
    },
  }
}

export const useBulkLauncher = create<BulkLauncherState>((set, get) => ({
  // Launch Mode
  launchMode: null,
  setLaunchMode: (mode) => set({ launchMode: mode }),

  // Edit Mode
  mode: null,
  setMode: (mode) => set({ mode }),
  editContext: null,
  setEditContext: (context) => set({ editContext: context }),
  editStrategy: initialEditStrategy,
  setEditStrategy: (strategy) =>
    set((state) => ({
      editStrategy: { ...state.editStrategy, ...strategy },
    })),

  currentStep: 0, // Start at mode selection
  setCurrentStep: (step) => set({ currentStep: step }),

  // Client
  clientId: null,
  setClientId: (clientId) => set({ clientId }),

  // Ad Account
  adAccountId: null,
  setAdAccountId: (adAccountId) => set({ adAccountId }),

  // Facebook Page
  facebookPageId: null,
  setFacebookPageId: (pageId) => set({ facebookPageId: pageId }),

  // Instagram Account
  instagramAccountId: null,
  setInstagramAccountId: (instagramAccountId) => set({ instagramAccountId }),

  // Facebook Pixel
  facebookPixelId: null,
  setFacebookPixelId: (pixelId) => set({ facebookPixelId: pixelId }),

  // Express Mode
  campaignObjective: null,
  setCampaignObjective: (objective) => set({ campaignObjective: objective }),
  geoTargeting: null,
  setGeoTargeting: (geo) => set({ geoTargeting: geo }),
  placementPreset: null,
  setPlacementPreset: (preset) => set({ placementPreset: preset }),
  audiencePreset: null,
  setAudiencePreset: (preset) => set({ audiencePreset: preset }),
  adCreatives: [],
  setAdCreatives: (creatives) => set({ adCreatives: creatives }),
  adCopy: {},
  setAdCopy: (copy) => set({ adCopy: copy }),

  // History
  history: {
    past: [],
    future: [],
  },

  canUndo: () => get().history.past.length > 0,
  canRedo: () => get().history.future.length > 0,

  undo: () => {
    const state = get()
    if (state.history.past.length === 0) return

    const previous = state.history.past[state.history.past.length - 1]
    if (!previous) return

    const newPast = state.history.past.slice(0, -1)
    const current = saveToHistory(state)

    set({
      ...restoreFromHistory(previous, state),
      history: {
        past: newPast,
        future: [current, ...state.history.future],
      },
    })
  },

  redo: () => {
    const state = get()
    if (state.history.future.length === 0) return

    const next = state.history.future[0]
    if (!next) return

    const newFuture = state.history.future.slice(1)
    const current = saveToHistory(state)

    set({
      ...restoreFromHistory(next, state),
      history: {
        past: [...state.history.past, current],
        future: newFuture,
      },
    })
  },

  // Campaign
  campaign: initialCampaign,
  updateCampaign: (data) =>
    set((state) => {
      let newCampaign = { ...state.campaign, ...data }

      // Auto-update redirection type when campaign type changes
      if (data.type && data.type !== state.campaign.type) {
        newCampaign.redirectionType = getDefaultRedirectionType(data.type)
        newCampaign.redirectionUrl = ''
        newCampaign.redirectionFormId = ''
        newCampaign.redirectionDeeplink = ''

        // Auto-complete Facebook API v24 fields (optimization goal, billing event, etc.)
        newCampaign = autoCompleteCampaignConfig(newCampaign) as Partial<CampaignConfig>
      }

      return { campaign: newCampaign }
    }),

  // Bulk Audiences
  bulkAudiences: initialBulkAudiences,
  updateBulkAudiences: (data) =>
    set((state) => ({
      bulkAudiences: { ...state.bulkAudiences, ...data },
    })),
  addAudience: (audience) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      // Trim history if exceeds max size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkAudiences: {
          ...state.bulkAudiences,
          audiences: [...state.bulkAudiences.audiences, audience],
        },
        history: {
          past: newPast,
          future: [], // Clear future on new action
        },
      }
    }),
  removeAudience: (id) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkAudiences: {
          ...state.bulkAudiences,
          audiences: state.bulkAudiences.audiences.filter((a) => a.id !== id),
        },
        history: {
          past: newPast,
          future: [],
        },
      }
    }),
  togglePlacementPreset: (preset) =>
    set((state) => {
      const current = state.bulkAudiences.placementPresets
      const newPresets = current.includes(preset)
        ? current.filter((p) => p !== preset)
        : [...current, preset]

      return {
        bulkAudiences: {
          ...state.bulkAudiences,
          placementPresets: newPresets.length > 0 ? newPresets : ['ALL_PLACEMENTS'],
        },
      }
    }),

  // Bulk Creatives
  bulkCreatives: initialBulkCreatives,
  updateBulkCreatives: (data) =>
    set((state) => ({
      bulkCreatives: { ...state.bulkCreatives, ...data },
    })),
  addCreative: (creative) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkCreatives: {
          ...state.bulkCreatives,
          creatives: [...state.bulkCreatives.creatives, creative],
        },
        history: {
          past: newPast,
          future: [],
        },
      }
    }),
  removeCreative: (id) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkCreatives: {
          ...state.bulkCreatives,
          creatives: state.bulkCreatives.creatives.filter((c) => c.id !== id),
        },
        history: {
          past: newPast,
          future: [],
        },
      }
    }),
  updateCreative: (id, data) =>
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        creatives: state.bulkCreatives.creatives.map((c) => (c.id === id ? { ...c, ...data } : c)),
      },
    })),
  updateCreativeCopy: (id, copy) =>
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        creativeCopies: {
          ...state.bulkCreatives.creativeCopies,
          [id]: copy,
        },
      },
    })),
  addCopyVariant: (variant) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkCreatives: {
          ...state.bulkCreatives,
          copyVariants: [...(state.bulkCreatives.copyVariants || []), variant],
        },
        history: {
          past: newPast,
          future: [],
        },
      }
    }),
  removeCopyVariant: (id) =>
    set((state) => {
      const currentSnapshot = saveToHistory(state)
      let newPast = [...state.history.past, currentSnapshot]

      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      }

      return {
        bulkCreatives: {
          ...state.bulkCreatives,
          copyVariants: (state.bulkCreatives.copyVariants || []).filter((v) => v.id !== id),
        },
        history: {
          past: newPast,
          future: [],
        },
      }
    }),

  // Matrix
  matrixConfig: initialMatrixConfig,
  updateMatrixConfig: (data) =>
    set((state) => ({
      matrixConfig: { ...state.matrixConfig, ...data },
    })),
  toggleDimension: (dimension) =>
    set((state) => ({
      matrixConfig: {
        ...state.matrixConfig,
        dimensions: {
          ...state.matrixConfig.dimensions,
          [dimension]: !state.matrixConfig.dimensions[dimension],
        },
      },
    })),

  // Generation
  generatedAdSets: [],
  generateCampaign: () => {
    const state = get()

    try {
      const adSets = generateAdSetsFromMatrix(
        state.campaign as CampaignConfig,
        state.bulkAudiences,
        state.bulkCreatives,
        state.matrixConfig.dimensions
      )

      set({ generatedAdSets: adSets })

      const stats = state.getMatrixStats()

      return {
        campaign: state.campaign as CampaignConfig,
        adSets,
        stats,
      }
    } catch (error) {
      console.error('Generation error:', error)
      return null
    }
  },

  getMatrixStats: () => {
    const state = get()
    return calculateMatrixStats(
      state.bulkAudiences.audiences,
      state.bulkAudiences.placementPresets,
      state.bulkCreatives.creatives,
      state.bulkCreatives.enableVariants,
      state.bulkCreatives.copyVariants || [],
      state.matrixConfig.dimensions
    )
  },

  // Progress tracking
  progressSteps: [],
  showProgress: false,
  setProgressSteps: (steps) => set({ progressSteps: steps }),
  updateProgressStep: (id, update) =>
    set((state) => ({
      progressSteps: state.progressSteps.map((step) =>
        step.id === id ? { ...step, ...update } : step
      ),
    })),
  setShowProgress: (show) => set({ showProgress: show }),

  // Upload progress tracking
  uploadProgress: [],
  setUploadProgress: (uploads) => set({ uploadProgress: uploads }),
  updateUploadProgress: (id, update) =>
    set((state) => ({
      uploadProgress: state.uploadProgress.map((upload) =>
        upload.id === id ? { ...upload, ...update } : upload
      ),
    })),
  addUploadProgress: (upload) =>
    set((state) => ({
      uploadProgress: [...state.uploadProgress, upload],
    })),

  // Launch callback
  launchCallback: null,
  setLaunchCallback: (callback) => set({ launchCallback: callback }),

  reset: () =>
    set({
      currentStep: 1,
      clientId: null,
      mode: null,
      editContext: null,
      editStrategy: initialEditStrategy,
      campaign: initialCampaign,
      bulkAudiences: initialBulkAudiences,
      bulkCreatives: initialBulkCreatives,
      matrixConfig: initialMatrixConfig,
      generatedAdSets: [],
      history: {
        past: [],
        future: [],
      },
      progressSteps: [],
      showProgress: false,
      uploadProgress: [],
    }),
}))
