import { create } from 'zustand'
import { clientsAPI } from '@/lib/api'
import type { Client } from '@/lib/types/client'

interface ClientsState {
  clients: Client[]
  selectedClientId: string | null
  isLoading: boolean
  setSelectedClient: (clientId: string | null) => void
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  getSelectedClient: () => Client | null
  fetchClients: () => Promise<void>
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  selectedClientId: null,
  isLoading: false,

  setSelectedClient: (clientId) => set({ selectedClientId: clientId }),

  addClient: (client) =>
    set((state) => ({
      clients: [
        ...state.clients,
        {
          ...client,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date(),
        },
      ],
    })),

  getSelectedClient: () => {
    const { clients, selectedClientId } = get()
    if (!selectedClientId) return null
    return clients.find((c) => c.id === selectedClientId) || null
  },

  fetchClients: async () => {
    set({ isLoading: true })
    try {
      const clients = await clientsAPI.list() as any
      set({ clients, isLoading: false })
    } catch (error) {
      console.error('Error fetching clients:', error)
      set({ clients: [], isLoading: false })
    }
  },
}))
