'use client'

import { trpc } from '@/lib/trpc'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@launcher-ads/ui'
import { Button } from '@launcher-ads/ui'

export default function HomePage() {
  const { data: health, isLoading } = trpc.health.useQuery()
  const { data: blueprints } = trpc.blueprint.list.useQuery()

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Launcher Ads</h1>
          <p className="mt-2 text-slate-600">
            Multi-platform ad campaign launcher and analyzer
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>API health check</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-slate-500">Loading...</p>
              ) : health ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{' '}
                    <span className="text-green-600">{health.status}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(health.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-red-600">API unavailable</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blueprints</CardTitle>
              <CardDescription>Campaign templates</CardDescription>
            </CardHeader>
            <CardContent>
              {blueprints ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{blueprints.length}</p>
                  <p className="text-sm text-slate-500">Total blueprints</p>
                </div>
              ) : (
                <p className="text-slate-500">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="default">
                  Create Blueprint
                </Button>
                <Button className="w-full" variant="outline">
                  View Launches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {blueprints && blueprints.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Recent Blueprints
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {blueprints.slice(0, 4).map((blueprint) => (
                <Card key={blueprint.id}>
                  <CardHeader>
                    <CardTitle>{blueprint.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {blueprint.platform} • {blueprint.status}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm" variant="default">
                        Launch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
