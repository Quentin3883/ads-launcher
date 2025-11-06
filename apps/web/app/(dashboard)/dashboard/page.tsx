'use client'

import Link from 'next/link'
import { Rocket, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react'
import { useClientsStore } from '@/lib/store/clients'
import { useLaunchesStore } from '@/lib/store/launches'
import { useUser } from '@/lib/hooks/use-user'
import { useMemo, useState, useEffect } from 'react'

export default function DashboardPage() {
  const { selectedClientId, getSelectedClient } = useClientsStore()
  const { getFilteredLaunches } = useLaunchesStore()
  const user = useUser()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only showing user name after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredLaunches = useMemo(
    () => getFilteredLaunches(selectedClientId),
    [selectedClientId, getFilteredLaunches]
  )

  const stats = useMemo(() => {
    const activeCampaigns = filteredLaunches.filter((l) => l.status === 'active').length
    const totalSpend = filteredLaunches.reduce((sum, l) => sum + (l.budget || 0), 0)

    return [
      { name: 'Active Campaigns', value: activeCampaigns.toString(), icon: Rocket, change: '+4.5%', changeType: 'positive' as const },
      { name: 'Total Reach', value: '145.2K', icon: Users, change: '+12.3%', changeType: 'positive' as const },
      { name: 'Conversion Rate', value: '3.24%', icon: TrendingUp, change: '+2.1%', changeType: 'positive' as const },
      { name: 'Total Spend', value: `$${(totalSpend / 1000).toFixed(1)}K`, icon: DollarSign, change: '-5.2%', changeType: 'negative' as const },
    ]
  }, [filteredLaunches])

  const selectedClient = getSelectedClient()
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedClient ? `${selectedClient.name} Dashboard` : `Hi ${mounted && user?.firstName ? user.firstName : 'there'}`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedClient
                ? `Viewing campaigns for ${selectedClient.name}`
                : "Welcome back! Here's what's happening with your campaigns."}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="rounded-xl bg-white/60 backdrop-blur-md border border-white/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${stat.changeType === 'positive' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{stat.name}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white/60 backdrop-blur-md border border-white/20 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/launches"
              className="group flex items-center justify-between rounded-lg bg-white/40 backdrop-blur-sm border border-white/30 p-4 transition-colors hover:bg-white/60"
            >
              <div>
                <h3 className="font-medium text-foreground">View Launches</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Manage campaigns</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/launches"
              className="group flex items-center justify-between rounded-lg bg-primary p-4 transition-opacity hover:opacity-90"
            >
              <div>
                <h3 className="font-medium text-white">Create Launch</h3>
                <p className="mt-0.5 text-xs text-white/80">Start new campaign</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/settings"
              className="group flex items-center justify-between rounded-lg bg-white/40 backdrop-blur-sm border border-white/30 p-4 transition-colors hover:bg-white/60"
            >
              <div>
                <h3 className="font-medium text-foreground">Settings</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Configure account</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
