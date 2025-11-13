'use client'

import { useMemo, useEffect, useState } from 'react'
import { Play, Pause, Trash2, Eye, Edit2 } from 'lucide-react'
import { useLaunchesStore, type Launch, type LaunchStatus } from '@/lib/store/launches'
import { cn } from '@launcher-ads/ui'
import { getUserId } from '@/lib/utils/get-user-id'

const statusConfig: Record<LaunchStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
}

function StatusBadge({ status }: { status: LaunchStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function LaunchRow({ launch, onEdit }: { launch: Launch; onEdit?: (launch: Launch) => void }) {
  const updateLaunch = useLaunchesStore((state) => state.updateLaunch)
  const deleteLaunch = useLaunchesStore((state) => state.deleteLaunch)

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="grid grid-cols-12 gap-6">
        {/* Name & Type */}
        <div className="col-span-3">
          <h3 className="font-display text-sm font-semibold">{launch.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{launch.type}</p>
        </div>

        {/* Country & Objective */}
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Country</p>
          <p className="mt-1 text-sm font-medium">{launch.country}</p>
        </div>

        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Objective</p>
          <p className="mt-1 text-sm font-medium">{launch.objective}</p>
        </div>

        {/* Status */}
        <div className="col-span-2">
          <p className="mb-2 text-xs text-muted-foreground">Status</p>
          <StatusBadge status={launch.status} />
        </div>

        {/* Progress */}
        <div className="col-span-2">
          <ProgressBar progress={launch.progress} />
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-1">
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(launch)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              title="Edit campaign"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() =>
              updateLaunch(launch.id, {
                status: launch.status === 'active' ? 'paused' : 'active',
              })
            }
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {launch.status === 'active' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => deleteLaunch(launch.id)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Formats */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Formats:</span>
        {launch.formats.map((format, index) => (
          <span
            key={`${format}-${index}`}
            className="inline-flex items-center rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LaunchList({ searchQuery, onEdit }: { searchQuery: string; onEdit?: (launch: Launch) => void }) {
  const launches = useLaunchesStore((state) => state.launches)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        setIsLoading(true)
        const userId = getUserId()

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bulk-launches?userId=${userId}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch launches')
        }

        const bulkLaunches = await response.json()

        // Transform to Launch interface format
        const transformedLaunches: Launch[] = bulkLaunches.map((bl: any) => ({
          id: bl.id,
          name: bl.name,
          type: bl.launchMode || 'Bulk',
          status: bl.status,
          country: bl.bulkAudiences?.geoLocations?.countries?.[0] || 'N/A',
          objective: bl.campaign?.objective || 'N/A',
          formats: bl.bulkCreatives?.creatives?.map((c: any) => c.format) || [],
          progress: bl.status === 'active' ? 100 : bl.status === 'launching' ? 50 : 0,
          createdAt: new Date(bl.createdAt),
          budget: bl.campaign?.budget,
          clientId: bl.clientId,
        }))

        // Update store
        useLaunchesStore.setState({ launches: transformedLaunches })
        setError(null)
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching launches:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLaunches()
  }, [])

  const filteredLaunches = useMemo(() => {
    if (!searchQuery) return launches
    const query = searchQuery.toLowerCase()
    return launches.filter(
      (launch) =>
        launch.name.toLowerCase().includes(query) ||
        launch.type.toLowerCase().includes(query) ||
        launch.country.toLowerCase().includes(query)
    )
  }, [launches, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 py-16">
        <p className="text-sm text-destructive">Error loading launches: {error}</p>
      </div>
    )
  }

  if (filteredLaunches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-16">
        <p className="text-sm text-muted-foreground">
          {searchQuery ? 'No launches found' : 'No launches yet'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {searchQuery ? 'Try a different search' : 'Create your first launch to get started'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredLaunches.map((launch) => (
        <LaunchRow key={launch.id} launch={launch} onEdit={onEdit} />
      ))}
    </div>
  )
}
