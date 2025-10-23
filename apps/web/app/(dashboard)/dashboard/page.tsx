'use client'

import Link from 'next/link'
import { Rocket, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react'

const stats = [
  { name: 'Active Campaigns', value: '12', icon: Rocket, change: '+4.5%', changeType: 'positive' },
  { name: 'Total Reach', value: '145.2K', icon: Users, change: '+12.3%', changeType: 'positive' },
  { name: 'Conversion Rate', value: '3.24%', icon: TrendingUp, change: '+2.1%', changeType: 'positive' },
  { name: 'Total Spend', value: '$24.5K', icon: DollarSign, change: '-5.2%', changeType: 'negative' },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{stat.value}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{stat.name}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="mb-6 font-display text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/launches"
              className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <h3 className="font-medium">View Launches</h3>
                <p className="mt-1 text-xs text-muted-foreground">Manage your campaigns</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>

            <Link
              href="/launches"
              className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <h3 className="font-medium">Create Launch</h3>
                <p className="mt-1 text-xs text-muted-foreground">Start a new campaign</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>

            <Link
              href="/settings"
              className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <h3 className="font-medium">Settings</h3>
                <p className="mt-1 text-xs text-muted-foreground">Configure your account</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
