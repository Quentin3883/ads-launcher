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

// Mock data
const mockLaunches: Launch[] = [
  {
    id: '1',
    name: 'Black Friday Campaign',
    type: 'Lead Form',
    status: 'active',
    country: 'United States',
    objective: 'Conversions',
    formats: ['Feed', 'Story'],
    progress: 75,
    createdAt: new Date('2025-10-20'),
    budget: 5000,
    clientId: '1', // Nike
  },
  {
    id: '2',
    name: 'Product Launch Q4',
    type: 'Landing Page',
    status: 'active',
    country: 'France',
    objective: 'Traffic',
    formats: ['Feed', 'Reel'],
    progress: 45,
    createdAt: new Date('2025-10-18'),
    budget: 3000,
    clientId: '2', // Adidas
  },
  {
    id: '3',
    name: 'Holiday Promo',
    type: 'Redirect',
    status: 'paused',
    country: 'Canada',
    objective: 'Awareness',
    formats: ['Story'],
    progress: 20,
    createdAt: new Date('2025-10-15'),
    budget: 2000,
    clientId: '1', // Nike
  },
  {
    id: '4',
    name: 'Customer Survey',
    type: 'Survey',
    status: 'draft',
    country: 'United Kingdom',
    objective: 'Engagement',
    formats: ['Feed'],
    progress: 10,
    createdAt: new Date('2025-10-22'),
    budget: 1000,
    clientId: '3', // Puma
  },
]

export const useLaunchesStore = create<LaunchesState>((set, get) => ({
  launches: mockLaunches,

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
