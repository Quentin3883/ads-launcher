'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Search, Plus } from 'lucide-react'
// Disable SSR for components with buttons to avoid Dashlane hydration mismatch
const LaunchTypeCards = dynamic(
  () => import('@/components/dashboard/launch-type-cards').then((mod) => mod.LaunchTypeCards),
  { ssr: false }
)

const LaunchList = dynamic(
  () => import('@/components/dashboard/launch-list').then((mod) => mod.LaunchList),
  { ssr: false }
)

// Code-split the heavy modal component
const BulkLauncherModal = dynamic(
  () => import('@/components/dashboard/bulk-launcher-modal').then((mod) => ({ default: mod.BulkLauncherModal })),
  { ssr: false }
)

export default function LaunchesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCampaignBuilderOpen, setIsCampaignBuilderOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-2xl font-semibold">Launches</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage your advertising campaigns
            </p>
          </div>
          <button
            onClick={() => setIsCampaignBuilderOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 pb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search launches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Recommended Types */}
          <section>
            <h2 className="mb-4 text-base font-semibold">Recommended Types</h2>
            <LaunchTypeCards onSelect={() => setIsCampaignBuilderOpen(true)} />
          </section>

          {/* Launches List */}
          <section>
            <h2 className="mb-4 text-base font-semibold">Your Launches</h2>
            <LaunchList searchQuery={searchQuery} />
          </section>
        </div>
      </div>

      {/* Bulk Launcher Modal */}
      <BulkLauncherModal
        open={isCampaignBuilderOpen}
        onOpenChange={setIsCampaignBuilderOpen}
      />
    </div>
  )
}
