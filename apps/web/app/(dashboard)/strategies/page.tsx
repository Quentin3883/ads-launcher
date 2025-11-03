'use client'

import { useState, useEffect } from 'react'
import { Plus, Workflow, Calendar, LayoutGrid, Table, Copy, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Strategy } from '@/lib/types/strategy'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type ViewMode = 'grid' | 'table'

export default function StrategiesPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const supabase = createClient()

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      setStrategies(data || [])
    } catch (error) {
      console.error('Error loading strategies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewStrategy = () => {
    router.push('/strategy')
  }

  const handleOpenStrategy = (strategyId: string) => {
    router.push(`/strategy?id=${strategyId}`)
  }

  const handleDuplicateStrategy = async (strategy: Strategy, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const { data, error } = await supabase
        .from('strategies')
        .insert([{
          name: `${strategy.name} (copy)`,
          description: strategy.description,
          nodes: strategy.nodes,
          budget_distribution: strategy.budget_distribution,
          user_id: strategy.user_id
        }])
        .select()
        .single()

      if (error) throw error

      // Reload strategies
      loadStrategies()
    } catch (error) {
      console.error('Error duplicating strategy:', error)
      alert('Failed to duplicate strategy')
    }
  }

  const handleDeleteStrategy = async (strategyId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this strategy?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', strategyId)

      if (error) throw error

      // Reload strategies
      loadStrategies()
    } catch (error) {
      console.error('Error deleting strategy:', error)
      alert('Failed to delete strategy')
    }
  }

  // Get unique platforms used in a strategy
  const getPlatforms = (strategy: Strategy): string[] => {
    const platforms = new Set<string>()
    strategy.nodes.forEach((node: any) => {
      if (node.data?.platform) {
        platforms.add(node.data.platform)
      }
    })
    return Array.from(platforms)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edece5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#151515] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading strategies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#edece5]">
      {/* Header */}
      <div className="border-b border-[#d9d8ce] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Workflow className="h-6 w-6 text-[#151515]" />
            <div>
              <h1 className="text-xl font-bold text-[#151515]">Strategy Library</h1>
              <p className="text-sm text-gray-600">
                {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#edece5] rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-[#151515]'
                    : 'text-gray-500 hover:text-[#151515]'
                }`}
                title="Table view"
              >
                <Table className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-[#151515]'
                    : 'text-gray-500 hover:text-[#151515]'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleNewStrategy}
              className="flex items-center gap-2 px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#252525] transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Strategy
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {strategies.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Workflow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No strategies yet</h2>
              <p className="text-gray-600 mb-6">
                Create your first marketing funnel strategy to get started
              </p>
              <button
                onClick={handleNewStrategy}
                className="flex items-center gap-2 px-6 py-3 bg-[#151515] text-white rounded-lg hover:bg-[#252525] transition-colors mx-auto"
              >
                <Plus className="h-5 w-5" />
                Create First Strategy
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl mx-auto">
            {strategies.map((strategy) => {
              const platforms = getPlatforms(strategy)
              return (
                <div
                  key={strategy.id}
                  className="bg-white rounded-lg border border-[#d9d8ce] hover:shadow-lg transition-all group"
                >
                  <div onClick={() => handleOpenStrategy(strategy.id)} className="p-4 cursor-pointer">
                    {/* Header with platforms */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-[#151515] flex-1">{strategy.name}</h3>
                      <div className="flex gap-1 ml-2">
                        {platforms.map((platform) => (
                          <div key={platform} className="w-6 h-6 relative flex-shrink-0">
                            <Image
                              src={`/${platform}-logo.svg`}
                              alt={platform}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Workflow className="h-3 w-3" />
                        {strategy.nodes.length}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(strategy.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>

                    {/* Budget Distribution */}
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                      {strategy.budget_distribution.awareness > 0 && (
                        <div
                          className="bg-blue-400"
                          style={{ width: `${strategy.budget_distribution.awareness}%` }}
                          title={`Awareness: ${strategy.budget_distribution.awareness}%`}
                        />
                      )}
                      {strategy.budget_distribution.consideration > 0 && (
                        <div
                          className="bg-purple-400"
                          style={{ width: `${strategy.budget_distribution.consideration}%` }}
                          title={`Consideration: ${strategy.budget_distribution.consideration}%`}
                        />
                      )}
                      {strategy.budget_distribution.conversion > 0 && (
                        <div
                          className="bg-green-400"
                          style={{ width: `${strategy.budget_distribution.conversion}%` }}
                          title={`Conversion: ${strategy.budget_distribution.conversion}%`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="border-t border-[#d9d8ce] px-4 py-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => handleDuplicateStrategy(strategy, e)}
                      className="p-1.5 text-gray-500 hover:text-[#151515] hover:bg-gray-100 rounded transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteStrategy(strategy.id, e)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg border border-[#d9d8ce] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8f8f6] border-b border-[#d9d8ce]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Platforms
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Blocks
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Budget Distribution
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9d8ce]">
                  {strategies.map((strategy) => {
                    const platforms = getPlatforms(strategy)
                    return (
                      <tr
                        key={strategy.id}
                        onClick={() => handleOpenStrategy(strategy.id)}
                        className="hover:bg-[#f8f8f6] cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#151515]">{strategy.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {platforms.map((platform) => (
                              <div key={platform} className="w-5 h-5 relative">
                                <Image
                                  src={`/${platform}-logo.svg`}
                                  alt={platform}
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {strategy.description || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {strategy.nodes.length}
                        </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-2 w-32 rounded-full overflow-hidden">
                            {strategy.budget_distribution.awareness > 0 && (
                              <div
                                className="bg-blue-400"
                                style={{ width: `${strategy.budget_distribution.awareness}%` }}
                              />
                            )}
                            {strategy.budget_distribution.consideration > 0 && (
                              <div
                                className="bg-purple-400"
                                style={{ width: `${strategy.budget_distribution.consideration}%` }}
                              />
                            )}
                            {strategy.budget_distribution.conversion > 0 && (
                              <div
                                className="bg-green-400"
                                style={{ width: `${strategy.budget_distribution.conversion}%` }}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {strategy.budget_distribution.awareness}% / {strategy.budget_distribution.consideration}% / {strategy.budget_distribution.conversion}%
                          </span>
                        </div>
                      </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(strategy.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleDuplicateStrategy(strategy, e)}
                              className="p-1.5 text-gray-500 hover:text-[#151515] hover:bg-gray-100 rounded transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteStrategy(strategy.id, e)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
