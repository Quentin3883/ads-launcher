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
} from '@/lib/types/bulk-launcher'
import {
  generateAdSetsFromMatrix,
  calculateMatrixStats,
  getDefaultRedirectionType,
} from '@/lib/types/bulk-launcher'

interface HistoryState {
  audiences: AudiencePreset[]
  creatives: Creative[]
  copyVariants: CopyVariant[]
}

interface BulkLauncherState {
  // Current step
  currentStep: number
  setCurrentStep: (step: number) => void

  // Client selection
  clientId: string | null
  setClientId: (clientId: string | null) => void

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

  // Actions
  reset: () => void
}

const initialCampaign: Partial<CampaignConfig> = {
  type: 'Traffic',
  objective: '',
  country: 'United States',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: '',
  budgetMode: 'CBO',
  budgetType: 'daily',
  budget: 1000,
  startDate: new Date().toISOString().split('T')[0],
  urlParamsOverride: '',
}

const initialBulkAudiences: BulkAudiencesConfig = {
  audiences: [],
  placementPresets: ['ALL_PLACEMENTS'],
  customPlacements: [],
  geoLocations: {
    countries: ['United States'],
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
    audiences: true,
    placements: true,
    creatives: true,
    formatVariants: true, // Feed + Story variants
    copyVariants: false,
  },
  softLimit: 300,
}

const MAX_HISTORY_SIZE = 50

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
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Client
  clientId: null,
  setClientId: (clientId) => set({ clientId }),

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
      const newCampaign = { ...state.campaign, ...data }

      // Auto-update redirection type when campaign type changes
      if (data.type && data.type !== state.campaign.type) {
        newCampaign.redirectionType = getDefaultRedirectionType(data.type)
        newCampaign.redirectionUrl = ''
        newCampaign.redirectionFormId = ''
        newCampaign.redirectionDeeplink = ''
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

  reset: () =>
    set({
      currentStep: 1,
      clientId: null,
      campaign: initialCampaign,
      bulkAudiences: initialBulkAudiences,
      bulkCreatives: initialBulkCreatives,
      matrixConfig: initialMatrixConfig,
      generatedAdSets: [],
      history: {
        past: [],
        future: [],
      },
    }),
}))
