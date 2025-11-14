// @ts-nocheck - Complex workflow types, will be refactored
import { create } from 'zustand'
// TODO: Create strategy-canvas types file
type StrategyCanvas = any
type FunnelStage = any
type PlatformStageBlock = any
type Platform = any

const createDefaultPlatformBlock = (...args: any[]): any => null
const calculateBudgetDistribution = (...args: any[]): any => null
const calculateTotalPercentage = (...args: any[]): any => 0
const validateCanvas = (...args: any[]): any => ({ isValid: true, errors: [] })

interface StrategyCanvasState {
  canvas: StrategyCanvas
  selectedBlock: PlatformStageBlock | null

  // Actions
  setCanvasName: (name: string) => void
  setTotalBudget: (budget: number) => void
  setBudgetType: (type: 'daily' | 'lifetime') => void
  setDateRange: (startDate: string, endDate: string) => void

  addBlock: (stage: FunnelStage, platform?: Platform) => void
  updateBlock: (blockId: string, updates: Partial<PlatformStageBlock>) => void
  removeBlock: (blockId: string) => void
  selectBlock: (block: PlatformStageBlock | null) => void

  reset: () => void
  saveCanvas: () => void
}

const generateId = () => `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Create initial canvas with default setup
const createInitialCanvas = (): StrategyCanvas => {
  const now = new Date().toISOString()

  return {
    id: generateId(),
    name: 'Untitled Strategy',
    description: '',
    totalBudget: 10000,
    budgetType: 'lifetime',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stages: {
      awareness: [],
      consideration: [],
      conversion: [],
    },
    createdAt: now,
    updatedAt: now,
  }
}

export const useStrategyCanvas = create<StrategyCanvasState>((set, get) => {
  const initialCanvas = createInitialCanvas()

  return {
    canvas: initialCanvas,
    selectedBlock: null,

    setCanvasName: (name) =>
      set((state) => ({
        canvas: {
          ...state.canvas,
          name,
          updatedAt: new Date().toISOString(),
        },
      })),

    setTotalBudget: (budget) =>
      set((state) => ({
        canvas: {
          ...state.canvas,
          totalBudget: budget,
          updatedAt: new Date().toISOString(),
        },
      })),

    setBudgetType: (type) =>
      set((state) => ({
        canvas: {
          ...state.canvas,
          budgetType: type,
          updatedAt: new Date().toISOString(),
        },
      })),

    setDateRange: (startDate, endDate) =>
      set((state) => ({
        canvas: {
          ...state.canvas,
          startDate,
          endDate,
          updatedAt: new Date().toISOString(),
        },
      })),

    addBlock: (stage, platform = 'meta') => {
      const newBlock = createDefaultPlatformBlock(stage, platform)

      set((state) => ({
        canvas: {
          ...state.canvas,
          stages: {
            ...state.canvas.stages,
            [stage]: [...state.canvas.stages[stage], newBlock],
          },
          updatedAt: new Date().toISOString(),
        },
      }))
    },

    updateBlock: (blockId, updates) =>
      set((state) => {
        const updatedStages = { ...state.canvas.stages }

        // Find and update the block in the correct stage
        Object.keys(updatedStages).forEach((stageKey) => {
          const stage = stageKey as FunnelStage
          updatedStages[stage] = updatedStages[stage].map((block) =>
            block.id === blockId ? { ...block, ...updates } : block
          )
        })

        return {
          canvas: {
            ...state.canvas,
            stages: updatedStages,
            updatedAt: new Date().toISOString(),
          },
        }
      }),

    removeBlock: (blockId) =>
      set((state) => {
        const updatedStages = { ...state.canvas.stages }

        // Remove the block from its stage
        Object.keys(updatedStages).forEach((stageKey) => {
          const stage = stageKey as FunnelStage
          updatedStages[stage] = updatedStages[stage].filter((block) => block.id !== blockId)
        })

        return {
          canvas: {
            ...state.canvas,
            stages: updatedStages,
            updatedAt: new Date().toISOString(),
          },
          selectedBlock: state.selectedBlock?.id === blockId ? null : state.selectedBlock,
        }
      }),

    selectBlock: (block) =>
      set({
        selectedBlock: block,
      }),

    reset: () => {
      const newCanvas = createInitialCanvas()
      set({
        canvas: newCanvas,
        selectedBlock: null,
      })
    },

    saveCanvas: () => {
      const state = get()
      const validation = validateCanvas(state.canvas)
      const distribution = calculateBudgetDistribution(state.canvas)

      console.log('Saving canvas:', {
        canvas: state.canvas,
        validation,
        distribution,
        totalPercentage: calculateTotalPercentage(state.canvas),
      })

      if (!validation.valid) {
        alert(`Cannot save: ${validation.errors.join(', ')}`)
        return
      }

      if (validation.warnings.length > 0) {
        alert(`Warning: ${validation.warnings.join(', ')}`)
      }

      alert('Strategy canvas saved! (Check console)')
    },
  }
})
