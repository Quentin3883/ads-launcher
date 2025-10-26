'use client'

import { useState, useMemo } from 'react'
import { Building2, Check, Search } from 'lucide-react'
import { useClientsStore } from '@/lib/store/clients'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { cn } from '@/lib/utils'

export function ClientSelectionStep() {
  const { clients } = useClientsStore()
  const { clientId, setClientId } = useBulkLauncher()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.adAccountId?.toLowerCase().includes(query)
    )
  }, [clients, searchQuery])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">Select a Client</h3>
        <p className="text-sm text-muted-foreground">
          Choose the client for this campaign. All generated campaigns will be associated with the selected client.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white/60 backdrop-blur-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Client list - scrollable if many clients */}
      <div className="max-h-[400px] overflow-y-auto space-y-3 px-1">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            onClick={() => setClientId(client.id)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border-2',
              clientId === client.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-white/60 backdrop-blur-md hover:border-primary/30 hover:bg-white/80'
            )}
          >
            {/* Client color */}
            <div
              className="h-12 w-12 rounded-lg flex-shrink-0"
              style={{ backgroundColor: client.color || '#d9d8ce' }}
            />

            {/* Client info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-foreground">{client.name}</h4>
              {client.adAccountId && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{client.adAccountId}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Created {client.createdAt.toLocaleDateString()}
              </p>
            </div>

            {/* Selected indicator */}
            {clientId === client.id && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary flex-shrink-0">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}

        {filteredClients.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No clients found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No clients available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please add a client before creating campaigns
          </p>
        </div>
      )}
    </div>
  )
}
