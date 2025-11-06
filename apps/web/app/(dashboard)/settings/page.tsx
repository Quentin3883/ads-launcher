'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings as SettingsIcon, Users, Plug } from 'lucide-react'
import { cn } from '@launcher-ads/ui'
import dynamic from 'next/dynamic'

// Lazy load sub-pages
const ClientsSettings = dynamic(() => import('@/components/settings/clients-settings').then(m => ({ default: m.ClientsSettings })), { ssr: false })
const IntegrationsSettings = dynamic(() => import('@/components/settings/integrations-settings').then(m => ({ default: m.IntegrationsSettings })), { ssr: false })

type TabId = 'clients' | 'integrations'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || 'clients')

  // Sync with URL parameter
  useEffect(() => {
    if (tabParam && (tabParam === 'clients' || tabParam === 'integrations')) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your clients and integrations
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'clients' && <ClientsSettings />}
        {activeTab === 'integrations' && <IntegrationsSettings />}
      </div>
    </div>
  )
}
