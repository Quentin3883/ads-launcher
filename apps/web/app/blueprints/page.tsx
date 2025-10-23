'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createBlueprintSchema,
  type CreateBlueprintInput,
} from '@launcher-ads/sdk'
import { trpc } from '@/lib/trpc'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@launcher-ads/ui'
import { Button } from '@launcher-ads/ui'

export default function BlueprintsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: blueprints, refetch } = trpc.blueprint.list.useQuery()
  const createMutation = trpc.blueprint.create.useMutation({
    onSuccess: () => {
      refetch()
      setShowForm(false)
      reset()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateBlueprintInput>({
    resolver: zodResolver(createBlueprintSchema),
    defaultValues: {
      platform: 'meta',
      status: 'draft',
      config: {
        budget: 1000,
        duration: 30,
        targetAudience: {
          age: { min: 25, max: 45 },
          locations: ['US'],
          interests: ['technology'],
        },
        creative: {
          headline: '',
          description: '',
          callToAction: 'Learn More',
        },
      },
    },
  })

  const onSubmit = (data: CreateBlueprintInput) => {
    createMutation.mutate(data)
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Blueprints</h1>
          <p className="mt-2 text-slate-600">
            Create and manage campaign blueprints
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Blueprint'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Blueprint</CardTitle>
            <CardDescription>
              Define your campaign structure and targeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Name *
                  </label>
                  <input
                    {...register('name')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Summer Sale Campaign"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Platform *
                  </label>
                  <select
                    {...register('platform')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="meta">Meta (Facebook/Instagram)</option>
                    <option value="google">Google Ads</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="snap">Snapchat</option>
                  </select>
                </div>
              </div>

              {/* Budget & Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Budget & Duration</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Budget ($) *
                    </label>
                    <input
                      {...register('config.budget', { valueAsNumber: true })}
                      type="number"
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="1000"
                    />
                    {errors.config?.budget && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.config.budget.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Duration (days) *
                    </label>
                    <input
                      {...register('config.duration', { valueAsNumber: true })}
                      type="number"
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Target Audience</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Age Min *
                    </label>
                    <input
                      {...register('config.targetAudience.age.min', {
                        valueAsNumber: true,
                      })}
                      type="number"
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Age Max *
                    </label>
                    <input
                      {...register('config.targetAudience.age.max', {
                        valueAsNumber: true,
                      })}
                      type="number"
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Locations (comma-separated) *
                  </label>
                  <input
                    {...register('config.targetAudience.locations')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="US, CA, UK"
                    onChange={(e) => {
                      const value = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                      register('config.targetAudience.locations').onChange({
                        target: { value },
                      })
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Interests (comma-separated) *
                  </label>
                  <input
                    {...register('config.targetAudience.interests')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="technology, marketing, startups"
                    onChange={(e) => {
                      const value = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                      register('config.targetAudience.interests').onChange({
                        target: { value },
                      })
                    }}
                  />
                </div>
              </div>

              {/* Creative */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Creative</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Headline *
                  </label>
                  <input
                    {...register('config.creative.headline')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Amazing Product Launch"
                  />
                  {errors.config?.creative?.headline && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.config.creative.headline.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Description *
                  </label>
                  <textarea
                    {...register('config.creative.description')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Get 50% off today only..."
                  />
                  {errors.config?.creative?.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.config.creative.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Image URL (optional)
                  </label>
                  <input
                    {...register('config.creative.imageUrl')}
                    type="url"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Call to Action *
                  </label>
                  <input
                    {...register('config.creative.callToAction')}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending
                    ? 'Creating...'
                    : 'Create Blueprint'}
                </Button>
              </div>

              {createMutation.error && (
                <p className="text-sm text-red-600">
                  Error: {createMutation.error.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blueprints List */}
      <div className="grid gap-4 md:grid-cols-2">
        {blueprints?.map((blueprint) => (
          <Card key={blueprint.id}>
            <CardHeader>
              <CardTitle>{blueprint.name}</CardTitle>
              <CardDescription className="capitalize">
                {blueprint.platform} • {blueprint.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Budget:</span> $
                  {blueprint.config.budget}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{' '}
                  {blueprint.config.duration} days
                </p>
                <p>
                  <span className="font-medium">Locations:</span>{' '}
                  {blueprint.config.targetAudience.locations.join(', ')}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline">
                  Edit
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
  )
}
