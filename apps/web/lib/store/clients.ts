import { create } from 'zustand'
import type { Client } from '@/lib/types/client'

interface ClientsState {
  clients: Client[]
  selectedClientId: string | null
  setSelectedClient: (clientId: string | null) => void
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  getSelectedClient: () => Client | null
}

// Mock clients data
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Nike',
    color: '#FF6B35',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Adidas',
    color: '#1E90FF',
    createdAt: new Date('2025-02-10'),
  },
  {
    id: '3',
    name: 'Puma',
    color: '#FFD700',
    createdAt: new Date('2025-03-05'),
  },
]

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: mockClients,
  selectedClientId: null,

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
}))
