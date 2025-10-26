'use client'

import { X, Plus, Trash2, Users } from 'lucide-react'
import type { CampaignNodeData, NodeDimension, AudienceConfig, AudienceType } from '@/lib/types/strategy-workflow'
import { META_OBJECTIVES, FUNNEL_STAGES, AUDIENCE_TYPES } from '@/lib/types/strategy-workflow'
import { useState, useEffect, useCallback, useRef } from 'react'

interface NodeConfigPanelProps {
  node: any | null
  onClose: () => void
  onUpdate: (nodeId: string, data: Partial<CampaignNodeData>) => void
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  const nodeData = node?.data as CampaignNodeData | undefined
  const isSyncingRef = useRef(false)
  const [label, setLabel] = useState(nodeData?.label || '')
  const [objective, setObjective] = useState(nodeData?.objective || 'LEADS')
  const [multiplier, setMultiplier] = useState(nodeData?.multiplier || 1)
  const [dimensions, setDimensions] = useState<NodeDimension[]>(nodeData?.dimensions || [])
  const [audiences, setAudiences] = useState<AudienceConfig[]>(nodeData?.audiences || [])

  // Sync state when node changes
  useEffect(() => {
    if (nodeData) {
      isSyncingRef.current = true
      setLabel(nodeData.label || '')
      setObjective(nodeData.objective || 'LEADS')
      setMultiplier(nodeData.multiplier || 1)
      setDimensions(nodeData.dimensions || [])
      setAudiences(nodeData.audiences || [])
      // Reset sync flag after a tick
      setTimeout(() => {
        isSyncingRef.current = false
      }, 0)
    }
  }, [nodeData])

  // Real-time update function with debouncing for text inputs
  const updateNodeData = useCallback(
    (updates: Partial<CampaignNodeData>) => {
      if (node) {
        onUpdate(node.id, updates)
      }
    },
    [node, onUpdate]
  )

  // Update on label change (debounced)
  useEffect(() => {
    if (!nodeData || isSyncingRef.current) return
    const timer = setTimeout(() => {
      if (label !== nodeData.label) {
        updateNodeData({ label })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [label, nodeData, updateNodeData])

  // Update on objective change (immediate)
  useEffect(() => {
    if (!nodeData || isSyncingRef.current) return
    if (objective !== nodeData.objective) {
      updateNodeData({ objective })
    }
  }, [objective, nodeData, updateNodeData])

  // Update on multiplier change (debounced)
  useEffect(() => {
    if (!nodeData || isSyncingRef.current) return
    const timer = setTimeout(() => {
      if (multiplier !== nodeData.multiplier) {
        updateNodeData({ multiplier })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [multiplier, nodeData, updateNodeData])

  // Update on dimensions change (immediate)
  useEffect(() => {
    if (!nodeData || isSyncingRef.current) return
    if (JSON.stringify(dimensions) !== JSON.stringify(nodeData.dimensions)) {
      updateNodeData({ dimensions })
    }
  }, [dimensions, nodeData, updateNodeData])

  // Update on audiences change (immediate)
  useEffect(() => {
    if (!nodeData || isSyncingRef.current) return
    if (JSON.stringify(audiences) !== JSON.stringify(nodeData.audiences)) {
      updateNodeData({ audiences })
    }
  }, [audiences, nodeData, updateNodeData])

  const addDimension = () => {
    const newDimension: NodeDimension = {
      id: `dim_${Date.now()}`,
      type: 'custom',
      label: 'New Dimension',
      variableCount: 3,
      variables: [
        { id: 'var_1', label: 'Variant #1' },
        { id: 'var_2', label: 'Variant #2' },
        { id: 'var_3', label: 'Variant #3' },
      ],
      combinationMode: 'multiply',
    }
    setDimensions([...dimensions, newDimension])
  }

  const updateDimension = (dimId: string, updates: Partial<NodeDimension>) => {
    setDimensions(dimensions.map(d => (d.id === dimId ? { ...d, ...updates } : d)))
  }

  const removeDimension = (dimId: string) => {
    setDimensions(dimensions.filter(d => d.id !== dimId))
  }

  const setVariableCount = (dimId: string, count: number) => {
    setDimensions(
      dimensions.map(dim => {
        if (dim.id !== dimId) return dim

        const variables = []
        for (let i = 0; i < count; i++) {
          const existing = dim.variables[i]
          if (existing) {
            variables.push(existing)
          } else {
            variables.push({
              id: `var_${i + 1}`,
              label: `${dim.label} #${i + 1}`,
            })
          }
        }

        return { ...dim, variableCount: count, variables }
      })
    )
  }

  const addAudience = (type: AudienceType) => {
    const newAudience: AudienceConfig = {
      type,
      count: 1,
    }
    setAudiences([...audiences, newAudience])
  }

  const updateAudienceCount = (index: number, count: number) => {
    setAudiences(
      audiences.map((aud, i) => (i === index ? { ...aud, count } : aud))
    )
  }

  const removeAudience = (index: number) => {
    setAudiences(audiences.filter((_, i) => i !== index))
  }

  const getTotalAudienceCount = () => {
    return audiences.reduce((sum, aud) => sum + aud.count, 0)
  }

  // If no node selected, show general settings
  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-[#d9d8ce] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Strategy Settings</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-3">Select a campaign block to configure its settings.</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <span>Awareness campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-200 rounded"></div>
                  <span>Consideration campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                  <span>Conversion campaigns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-[#d9d8ce] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Configure Block</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Basic Settings - Single column */}
            <div className="space-y-3">
              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Block Name</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#151515]"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Objective</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#151515]"
                >
                  {Object.entries(META_OBJECTIVES).map(([key, obj]) => (
                    <option key={key} value={key}>
                      {obj.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiplier */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Multiplier
                </label>
                <input
                  type="number"
                  min="1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 text-sm border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#151515]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {multiplier}x campaigns per combination
                </p>
              </div>
            </div>

            {/* Audiences Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Audiences
                  {getTotalAudienceCount() > 0 && (
                    <span className="text-xs font-bold text-[#151515] bg-[#edece5] px-1.5 py-0.5 rounded">
                      {getTotalAudienceCount()}
                    </span>
                  )}
                </label>
              </div>

              <div className="space-y-2">
                {audiences.map((audience, index) => {
                  const audienceType = AUDIENCE_TYPES[audience.type]
                  return (
                    <div
                      key={index}
                      className="p-3 border border-[#d9d8ce] rounded-lg bg-gray-50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#151515] flex items-center gap-2">
                            <span>{audienceType.icon}</span>
                            {audienceType.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {audienceType.description}
                          </div>
                        </div>
                        <button
                          onClick={() => removeAudience(index)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Number of {audienceType.label} audiences
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={audience.count}
                          onChange={(e) =>
                            updateAudienceCount(index, parseInt(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1 text-sm border border-[#d9d8ce] rounded focus:outline-none focus:ring-2 focus:ring-[#151515]"
                        />
                      </div>
                    </div>
                  )
                })}

                {audiences.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-3">
                    No audiences yet.
                  </p>
                )}
              </div>

              {/* Add Audience Buttons */}
              <div className="mt-2 flex flex-col gap-1.5">
                {Object.entries(AUDIENCE_TYPES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => addAudience(key as AudienceType)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs border border-[#d9d8ce] rounded hover:bg-gray-50 hover:border-[#151515] transition-all"
                  >
                    <span className="text-sm">{config.icon}</span>
                    <span className="flex-1 text-left">{config.label}</span>
                    <Plus className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">Dimensions</label>
                <div className="relative group">
                  <button className="text-xs text-[#151515] hover:underline flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#d9d8ce] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => {
                        const preset: NodeDimension = {
                          id: `dim_${Date.now()}`,
                          type: 'value_proposition',
                          label: 'Value Proposition',
                          variableCount: 3,
                          variables: [
                            { id: 'var_1', label: 'PV #1' },
                            { id: 'var_2', label: 'PV #2' },
                            { id: 'var_3', label: 'PV #3' },
                          ],
                          combinationMode: 'multiply',
                        }
                        setDimensions([...dimensions, preset])
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs first:rounded-t-lg border-b border-[#d9d8ce]"
                    >
                      <div className="font-medium">Value Proposition</div>
                    </button>
                    <button
                      onClick={() => {
                        const preset: NodeDimension = {
                          id: `dim_${Date.now()}`,
                          type: 'region',
                          label: 'Region',
                          variableCount: 3,
                          variables: [
                            { id: 'var_1', label: 'Region #1' },
                            { id: 'var_2', label: 'Region #2' },
                            { id: 'var_3', label: 'Region #3' },
                          ],
                          combinationMode: 'multiply',
                        }
                        setDimensions([...dimensions, preset])
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs border-b border-[#d9d8ce]"
                    >
                      <div className="font-medium">Region</div>
                    </button>
                    <button
                      onClick={() => {
                        const preset: NodeDimension = {
                          id: `dim_${Date.now()}`,
                          type: 'audience',
                          label: 'Audience',
                          variableCount: 4,
                          variables: [
                            { id: 'var_1', label: 'Audience #1' },
                            { id: 'var_2', label: 'Audience #2' },
                            { id: 'var_3', label: 'Audience #3' },
                            { id: 'var_4', label: 'Audience #4' },
                          ],
                          combinationMode: 'multiply',
                        }
                        setDimensions([...dimensions, preset])
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs border-b border-[#d9d8ce]"
                    >
                      <div className="font-medium">Audience</div>
                    </button>
                    <button
                      onClick={() => {
                        const preset: NodeDimension = {
                          id: `dim_${Date.now()}`,
                          type: 'creative',
                          label: 'Creative',
                          variableCount: 5,
                          variables: [
                            { id: 'var_1', label: 'Creative #1' },
                            { id: 'var_2', label: 'Creative #2' },
                            { id: 'var_3', label: 'Creative #3' },
                            { id: 'var_4', label: 'Creative #4' },
                            { id: 'var_5', label: 'Creative #5' },
                          ],
                          combinationMode: 'separate',
                        }
                        setDimensions([...dimensions, preset])
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs border-b border-[#d9d8ce]"
                    >
                      <div className="font-medium">Creative</div>
                    </button>
                    <button
                      onClick={addDimension}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs last:rounded-b-lg"
                    >
                      <div className="font-medium">Custom</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {dimensions.map((dim) => (
                  <div key={dim.id} className="p-2 border border-[#d9d8ce] rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={dim.label}
                        onChange={(e) => updateDimension(dim.id, { label: e.target.value })}
                        className="flex-1 px-2 py-1 text-sm border border-[#d9d8ce] rounded focus:outline-none focus:ring-2 focus:ring-[#151515]"
                        placeholder="Dimension name"
                      />
                      <button
                        onClick={() => removeDimension(dim.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Number of variants
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={dim.variableCount}
                        onChange={(e) => setVariableCount(dim.id, parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-[#d9d8ce] rounded focus:outline-none focus:ring-2 focus:ring-[#151515]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Combination Mode
                      </label>
                      <select
                        value={dim.combinationMode}
                        onChange={(e) =>
                          updateDimension(dim.id, { combinationMode: e.target.value as any })
                        }
                        className="w-full px-2 py-1 text-sm border border-[#d9d8ce] rounded focus:outline-none focus:ring-2 focus:ring-[#151515]"
                      >
                        <option value="multiply">Multiply (combine with others)</option>
                        <option value="separate">Separate (1 campaign each)</option>
                      </select>
                    </div>

                    <div className="text-xs text-gray-500">
                      {dim.variables.length} variant{dim.variables.length !== 1 ? 's' : ''} (
                      {dim.combinationMode === 'multiply' ? 'multiplied' : 'separate'})
                    </div>
                  </div>
                ))}

                {dimensions.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-3">
                    No dimensions yet.
                  </p>
                )}
              </div>
            </div>
      </div>
    </div>
  )
}
