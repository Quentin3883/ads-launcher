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

interface BulkLauncherState {
  // Current step
  currentStep: number
  setCurrentStep: (step: number) => void

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

export const useBulkLauncher = create<BulkLauncherState>((set, get) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

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
    set((state) => ({
      bulkAudiences: {
        ...state.bulkAudiences,
        audiences: [...state.bulkAudiences.audiences, audience],
      },
    })),
  removeAudience: (id) =>
    set((state) => ({
      bulkAudiences: {
        ...state.bulkAudiences,
        audiences: state.bulkAudiences.audiences.filter((a) => a.id !== id),
      },
    })),
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
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        creatives: [...state.bulkCreatives.creatives, creative],
      },
    })),
  removeCreative: (id) =>
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        creatives: state.bulkCreatives.creatives.filter((c) => c.id !== id),
      },
    })),
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
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        copyVariants: [...(state.bulkCreatives.copyVariants || []), variant],
      },
    })),
  removeCopyVariant: (id) =>
    set((state) => ({
      bulkCreatives: {
        ...state.bulkCreatives,
        copyVariants: (state.bulkCreatives.copyVariants || []).filter((v) => v.id !== id),
      },
    })),

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
      campaign: initialCampaign,
      bulkAudiences: initialBulkAudiences,
      bulkCreatives: initialBulkCreatives,
      matrixConfig: initialMatrixConfig,
      generatedAdSets: [],
    }),
}))
