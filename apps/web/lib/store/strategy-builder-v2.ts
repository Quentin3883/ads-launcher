import { create } from 'zustand'
import type {
  Strategy,
  Dimension,
  DimensionVariable,
  Platform,
  MetaObjective,
  MatrixCalculationResult,
} from '@/lib/types/strategy-builder-v2'
import {
  DIMENSION_TEMPLATES,
  calculateCampaignMatrix,
  validateStrategy,
} from '@/lib/types/strategy-builder-v2'

interface StrategyBuilderState {
  strategy: Strategy
  selectedDimension: Dimension | null
  matrixResult: MatrixCalculationResult | null

  // Strategy actions
  setStrategyName: (name: string) => void
  setPlatform: (platform: Platform) => void
  setObjective: (objective: MetaObjective) => void

  // Dimension actions
  addDimension: (templateKey: string) => void
  addCustomDimension: (dimension: Omit<Dimension, 'id'>) => void
  updateDimension: (dimensionId: string, updates: Partial<Dimension>) => void
  removeDimension: (dimensionId: string) => void
  toggleDimension: (dimensionId: string) => void
  selectDimension: (dimension: Dimension | null) => void

  // Dimension variable actions
  addDimensionVariable: (dimensionId: string) => void
  updateDimensionVariable: (dimensionId: string, variableId: string, updates: Partial<DimensionVariable>) => void
  removeDimensionVariable: (dimensionId: string, variableId: string) => void
  setVariableCount: (dimensionId: string, count: number) => void

  // Matrix calculation
  recalculateMatrix: () => void

  // Utility
  reset: () => void
  saveStrategy: () => void
  loadTemplate: (templateName: string) => void
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Create initial empty strategy
const createInitialStrategy = (): Strategy => {
  const now = new Date().toISOString()

  return {
    id: `strategy_${generateId()}`,
    name: 'Untitled Strategy',
    description: '',
    platform: 'meta',
    objective: 'LEADS',
    dimensions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const useStrategyBuilder = create<StrategyBuilderState>((set, get) => {
  const initialStrategy = createInitialStrategy()

  return {
    strategy: initialStrategy,
    selectedDimension: null,
    matrixResult: calculateCampaignMatrix(initialStrategy),

    setStrategyName: (name) =>
      set((state) => ({
        strategy: {
          ...state.strategy,
          name,
          updatedAt: new Date().toISOString(),
        },
      })),

    setPlatform: (platform) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          platform,
          updatedAt: new Date().toISOString(),
        },
      }))
      get().recalculateMatrix()
    },

    setObjective: (objective) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          objective,
          updatedAt: new Date().toISOString(),
        },
      }))
      get().recalculateMatrix()
    },

    // Dimension actions
    addDimension: (templateKey) => {
      const template = DIMENSION_TEMPLATES[templateKey]
      if (!template) return

      const newDimension: Dimension = {
        id: `dim_${generateId()}`,
        type: template.type,
        label: template.label,
        description: template.description,
        scope: template.scope,
        combinationMode: template.combinationMode,
        variableCount: template.variableCount,
        variables: template.variables,
        applyToStages: template.applyToStages,
        applyToPlatforms: template.applyToPlatforms,
        enabled: template.enabled,
        isTemplate: template.isTemplate,
      }

      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: [...state.strategy.dimensions, newDimension],
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    addCustomDimension: (dimension) => {
      const newDimension: Dimension = {
        id: `dim_${generateId()}`,
        ...dimension,
      }

      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: [...state.strategy.dimensions, newDimension],
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    updateDimension: (dimensionId, updates) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) =>
            dim.id === dimensionId ? { ...dim, ...updates } : dim
          ),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    removeDimension: (dimensionId) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.filter((dim) => dim.id !== dimensionId),
          updatedAt: new Date().toISOString(),
        },
        selectedDimension:
          state.selectedDimension?.id === dimensionId ? null : state.selectedDimension,
      }))

      get().recalculateMatrix()
    },

    toggleDimension: (dimensionId) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) =>
            dim.id === dimensionId ? { ...dim, enabled: !dim.enabled } : dim
          ),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    selectDimension: (dimension) =>
      set({
        selectedDimension: dimension,
      }),

    // Dimension variable actions
    addDimensionVariable: (dimensionId) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) => {
            if (dim.id !== dimensionId) return dim

            const newVariable: DimensionVariable = {
              id: `var_${dim.variables.length + 1}`,
              label: `${dim.label} #${dim.variables.length + 1}`,
            }

            return {
              ...dim,
              variables: [...dim.variables, newVariable],
              variableCount: dim.variables.length + 1,
            }
          }),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    updateDimensionVariable: (dimensionId, variableId, updates) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) =>
            dim.id === dimensionId
              ? {
                  ...dim,
                  variables: dim.variables.map((v) =>
                    v.id === variableId ? { ...v, ...updates } : v
                  ),
                }
              : dim
          ),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    removeDimensionVariable: (dimensionId, variableId) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) => {
            if (dim.id !== dimensionId) return dim

            return {
              ...dim,
              variables: dim.variables.filter((v) => v.id !== variableId),
              variableCount: dim.variables.length - 1,
            }
          }),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    setVariableCount: (dimensionId, count) => {
      set((state) => ({
        strategy: {
          ...state.strategy,
          dimensions: state.strategy.dimensions.map((dim) => {
            if (dim.id !== dimensionId) return dim

            const currentCount = dim.variables.length
            let newVariables = [...dim.variables]

            if (count > currentCount) {
              // Add new variables
              for (let i = currentCount; i < count; i++) {
                newVariables.push({
                  id: `var_${i + 1}`,
                  label: `${dim.label} #${i + 1}`,
                })
              }
            } else if (count < currentCount) {
              // Remove excess variables
              newVariables = newVariables.slice(0, count)
            }

            return {
              ...dim,
              variables: newVariables,
              variableCount: count,
            }
          }),
          updatedAt: new Date().toISOString(),
        },
      }))

      get().recalculateMatrix()
    },

    // Matrix calculation
    recalculateMatrix: () => {
      const { strategy } = get()
      const matrixResult = calculateCampaignMatrix(strategy)
      set({ matrixResult })
    },

    // Utility
    reset: () => {
      const newStrategy = createInitialStrategy()
      set({
        strategy: newStrategy,
        selectedDimension: null,
        matrixResult: calculateCampaignMatrix(newStrategy),
      })
    },

    saveStrategy: () => {
      // TODO: Implement save to backend or localStorage
      console.log('Saving strategy:', get().strategy)
    },

    loadTemplate: (templateName) => {
      // TODO: Implement template loading
      console.log('Loading template:', templateName)
    },
  }
})
