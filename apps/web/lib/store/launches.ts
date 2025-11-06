import { create } from 'zustand'

export type LaunchStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface Launch {
  id: string
  name: string
  type: string
  status: LaunchStatus
  country: string
  objective: string
  formats: string[]
  progress: number
  createdAt: Date
  budget?: number
  clientId?: string
}

interface LaunchesState {
  launches: Launch[]
  addLaunch: (launch: Omit<Launch, 'id' | 'createdAt'>) => void
  updateLaunch: (id: string, updates: Partial<Launch>) => void
  deleteLaunch: (id: string) => void
  getFilteredLaunches: (clientId?: string | null) => Launch[]
}

export const useLaunchesStore = create<LaunchesState>((set, get) => ({
  launches: [],

  addLaunch: (launch) =>
    set((state) => ({
      launches: [
        ...state.launches,
        {
          ...launch,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date(),
        },
      ],
    })),

  updateLaunch: (id, updates) =>
    set((state) => ({
      launches: state.launches.map((launch) =>
        launch.id === id ? { ...launch, ...updates } : launch
      ),
    })),

  deleteLaunch: (id) =>
    set((state) => ({
      launches: state.launches.filter((launch) => launch.id !== id),
    })),

  getFilteredLaunches: (clientId) => {
    const { launches } = get()
    if (!clientId) return launches
    return launches.filter((launch) => launch.clientId === clientId)
  },
}))
