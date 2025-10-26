import { create } from 'zustand'
import type {
  StrategyBlueprint,
  StrategyStage,
  PlatformConfig,
  PlatformId,
  MetaPlatformOptions,
  AudienceType,
  MetaObjective,
  CombinationRule,
  StrategyPreview,
} from '@/lib/types/strategy-builder'
import {
  calculateStrategyPreview,
  DEFAULT_META_OPTIONS,
} from '@/lib/types/strategy-builder'

interface StrategyBuilderState {
  // Current strategy
  strategy: StrategyBlueprint

  // Actions
  updateStrategyName: (name: string) => void
  updateTotalBudget: (budget: number) => void
  updateStageBudgetShare: (stageId: string, budgetShare: number) => void

  // Platform actions
  togglePlatform: (stageId: string, platformId: PlatformId) => void

  // Meta-specific actions
  updateMetaObjective: (stageId: string, objective: MetaObjective) => void
  updateMetaAudienceTypes: (stageId: string, audienceTypes: AudienceType[]) => void
  updateMetaCombinationRule: (stageId: string, rule: CombinationRule) => void
  updateMetaEstimates: (stageId: string, audiences: number, creatives: number) => void

  // Preview
  getPreview: () => StrategyPreview

  // Reset
  reset: () => void
}

// Helper to generate unique IDs
const generateId = () => `stg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Default platforms configuration
const createDefaultPlatforms = (): PlatformConfig[] => [
  {
    platformId: 'meta',
    status: 'active',
    enabled: true,
    metaOptions: { ...DEFAULT_META_OPTIONS },
  },
  {
    platformId: 'google',
    status: 'soon',
    enabled: false,
  },
  {
    platformId: 'linkedin',
    status: 'soon',
    enabled: false,
  },
  {
    platformId: 'tiktok',
    status: 'soon',
    enabled: false,
  },
]

// Default strategy blueprint
const createDefaultStrategy = (): StrategyBlueprint => {
  const now = new Date().toISOString()

  return {
    id: generateId(),
    name: 'Untitled Strategy',
    totalBudget: 10000,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    stages: [
      {
        id: 'stage_awareness',
        stage: 'awareness',
        label: 'Awareness',
        budgetShare: 10,
        platforms: createDefaultPlatforms(),
      },
      {
        id: 'stage_consideration',
        stage: 'consideration',
        label: 'Consideration',
        budgetShare: 25,
        platforms: createDefaultPlatforms(),
      },
      {
        id: 'stage_conversion',
        stage: 'conversion',
        label: 'Conversion',
        budgetShare: 65,
        platforms: createDefaultPlatforms(),
      },
    ],
  }
}

export const useStrategyBuilder = create<StrategyBuilderState>((set, get) => ({
  strategy: createDefaultStrategy(),

  updateStrategyName: (name) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        name,
        updatedAt: new Date().toISOString(),
      },
    })),

  updateTotalBudget: (budget) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        totalBudget: budget,
        updatedAt: new Date().toISOString(),
      },
    })),

  updateStageBudgetShare: (stageId, budgetShare) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) =>
          stage.id === stageId ? { ...stage, budgetShare } : stage
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  togglePlatform: (stageId, platformId) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            platforms: stage.platforms.map((platform) => {
              if (platform.platformId !== platformId) return platform
              if (platform.status !== 'active') return platform // Can't enable SOON platforms

              return {
                ...platform,
                enabled: !platform.enabled,
              }
            }),
          }
        }),
        updatedAt: new Date().toISOString(),
      },
    })),

  updateMetaObjective: (stageId, objective) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            platforms: stage.platforms.map((platform) => {
              if (platform.platformId !== 'meta' || !platform.metaOptions) return platform

              return {
                ...platform,
                metaOptions: {
                  ...platform.metaOptions,
                  objective,
                },
              }
            }),
          }
        }),
        updatedAt: new Date().toISOString(),
      },
    })),

  updateMetaAudienceTypes: (stageId, audienceTypes) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            platforms: stage.platforms.map((platform) => {
              if (platform.platformId !== 'meta' || !platform.metaOptions) return platform

              return {
                ...platform,
                metaOptions: {
                  ...platform.metaOptions,
                  audienceTypes,
                },
              }
            }),
          }
        }),
        updatedAt: new Date().toISOString(),
      },
    })),

  updateMetaCombinationRule: (stageId, rule) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            platforms: stage.platforms.map((platform) => {
              if (platform.platformId !== 'meta' || !platform.metaOptions) return platform

              return {
                ...platform,
                metaOptions: {
                  ...platform.metaOptions,
                  combinationRule: rule,
                },
              }
            }),
          }
        }),
        updatedAt: new Date().toISOString(),
      },
    })),

  updateMetaEstimates: (stageId, audiences, creatives) =>
    set((state) => ({
      strategy: {
        ...state.strategy,
        stages: state.strategy.stages.map((stage) => {
          if (stage.id !== stageId) return stage

          return {
            ...stage,
            platforms: stage.platforms.map((platform) => {
              if (platform.platformId !== 'meta' || !platform.metaOptions) return platform

              return {
                ...platform,
                metaOptions: {
                  ...platform.metaOptions,
                  estimatedAudiences: audiences,
                  estimatedCreatives: creatives,
                },
              }
            }),
          }
        }),
        updatedAt: new Date().toISOString(),
      },
    })),

  getPreview: () => {
    const { strategy } = get()
    return calculateStrategyPreview(strategy)
  },

  reset: () =>
    set({
      strategy: createDefaultStrategy(),
    }),
}))
