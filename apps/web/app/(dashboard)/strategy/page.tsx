'use client'

import { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlatformSidebar } from '@/components/strategy-workflow/platform-sidebar'
import { NodeConfigPanel } from '@/components/strategy-workflow/node-config-panel'
import { FunnelColumn } from '@/components/strategy-workflow/funnel-column'
import { FunnelPreview } from '@/components/strategy-workflow/funnel-preview'
import { BudgetSlider } from '@/components/strategy-workflow/budget-slider'
import type { CampaignNodeData, Platform, FunnelStage } from '@/lib/types/workflow'
import { getStageFromObjective, getDefaultObjectiveForStage } from '@/lib/utils/workflow'
import { createClient } from '@/lib/supabase/client'
import { Workflow, Save, Eye, Edit3, ArrowLeft } from 'lucide-react'

type Node = {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

export default function StrategyWorkflowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodeCounter, setNodeCounter] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [strategyDescription, setStrategyDescription] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Budget state - two cursors define the boundaries
  const [firstCursor, setFirstCursor] = useState(15) // End of Awareness
  const [secondCursor, setSecondCursor] = useState(40) // End of Consideration (15 + 25)

  // Refs for circular dependencies
  const deleteNodeRef = useRef<((nodeId: string) => void) | null>(null)

  // Delete node callback
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))

      // Close config panel if the deleted node was selected
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
    },
    [selectedNode]
  )
  deleteNodeRef.current = deleteNode

  const onNodeClick = useCallback((node: Node) => {
    if (node.type === 'campaign') {
      setSelectedNode(node)
    }
  }, [])

  // Filter nodes by stage using useMemo for performance
  const nodesByStage = useMemo(() => ({
    awareness: nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'awareness'),
    consideration: nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'consideration'),
    conversion: nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'conversion'),
  }), [nodes])

  // Determine which stages have blocks
  const activeStages = useMemo(() => ({
    awareness: nodesByStage.awareness.length > 0,
    consideration: nodesByStage.consideration.length > 0,
    conversion: nodesByStage.conversion.length > 0,
  }), [nodesByStage])

  const activeStageCount = useMemo(() => {
    return (activeStages.awareness ? 1 : 0) + (activeStages.consideration ? 1 : 0) + (activeStages.conversion ? 1 : 0)
  }, [activeStages])

  // Load strategy from Supabase if ID is present in URL
  useEffect(() => {
    const loadStrategy = async () => {
      const id = searchParams?.get('id')

      if (!id) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data) {
          // Load strategy data
          setStrategyId(data.id)
          setStrategyName(data.name)
          setStrategyDescription(data.description || '')

          // Restore nodes with onDelete callback
          const restoredNodes = data.nodes.map((node: Node) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: deleteNodeRef.current,
            },
          }))
          setNodes(restoredNodes)

          // Restore budget distribution
          if (data.budget_distribution) {
            const { awareness, consideration } = data.budget_distribution
            // Calculate cursor positions from percentages
            setFirstCursor(awareness)
            setSecondCursor(awareness + consideration)
          }

          // Update node counter based on existing nodes
          const maxCounter = restoredNodes.reduce((max: number, node: Node) => {
            const match = node.data.label.match(/\d+$/)
            return match ? Math.max(max, parseInt(match[0])) : max
          }, 0)
          setNodeCounter(maxCounter)
        }
      } catch (error) {
        console.error('Error loading strategy:', error)
        alert('Failed to load strategy')
      } finally {
        setLoading(false)
      }
    }

    loadStrategy()
  }, [searchParams, supabase])

  // Auto-adjust cursors when transitioning from 2 to 3 active stages
  useEffect(() => {
    if (activeStageCount === 3) {
      // When all 3 stages become active, ensure cursors don't overlap
      // Set default split if secondCursor is too close to firstCursor
      if (secondCursor - firstCursor < 10) {
        setFirstCursor(15)
        setSecondCursor(40)
      }
    }
  }, [activeStageCount, firstCursor, secondCursor])

  // Close config panel if selected node no longer exists
  useEffect(() => {
    if (selectedNode && !nodes.find(n => n.id === selectedNode.id)) {
      setSelectedNode(null)
    }
  }, [nodes, selectedNode])

  // Calculate budget percentages based on active stages
  const { awarenessPercentage, considerationPercentage, conversionPercentage } = useMemo(() => {
    // If no stages have blocks, show empty
    if (activeStageCount === 0) {
      return {
        awarenessPercentage: 0,
        considerationPercentage: 0,
        conversionPercentage: 0,
      }
    }

    // If only one stage has blocks, give it 100%
    if (activeStageCount === 1) {
      return {
        awarenessPercentage: activeStages.awareness ? 100 : 0,
        considerationPercentage: activeStages.consideration ? 100 : 0,
        conversionPercentage: activeStages.conversion ? 100 : 0,
      }
    }

    // If two stages have blocks, use firstCursor to split between them
    if (activeStageCount === 2) {
      if (activeStages.awareness && activeStages.consideration) {
        return { awarenessPercentage: firstCursor, considerationPercentage: 100 - firstCursor, conversionPercentage: 0 }
      }
      if (activeStages.awareness && activeStages.conversion) {
        return { awarenessPercentage: firstCursor, considerationPercentage: 0, conversionPercentage: 100 - firstCursor }
      }
      if (activeStages.consideration && activeStages.conversion) {
        return { awarenessPercentage: 0, considerationPercentage: firstCursor, conversionPercentage: 100 - firstCursor }
      }
    }

    // If all three stages have blocks, use both cursor positions
    return {
      awarenessPercentage: firstCursor,
      considerationPercentage: secondCursor - firstCursor,
      conversionPercentage: 100 - secondCursor,
    }
  }, [activeStageCount, activeStages, firstCursor, secondCursor])

  // Handle node drop between columns
  const handleNodeDrop = useCallback((nodeId: string, targetStage: FunnelStage) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Change the objective based on the target stage
          const newObjective = getDefaultObjectiveForStage(targetStage)
          return {
            ...node,
            data: {
              ...node.data,
              objective: newObjective,
            },
          }
        }
        return node
      })
    )
  }, [])

  // Handle node reorder within same column
  const handleNodeReorder = useCallback((nodeId: string, targetIndex: number, stage: FunnelStage) => {
    setNodes((nds) => {
      // Get nodes in this stage
      const stageNodes = nds.filter(
        (n) => n.type === 'campaign' && n.data.objective && getStageFromObjective(n.data.objective) === stage
      )
      const otherNodes = nds.filter(
        (n) => !(n.type === 'campaign' && n.data.objective && getStageFromObjective(n.data.objective) === stage)
      )

      // Find the dragged node and its current index
      const currentIndex = stageNodes.findIndex((n) => n.id === nodeId)
      const draggedNode = stageNodes[currentIndex]
      if (!draggedNode || currentIndex === -1) return nds

      // Remove dragged node from current position
      const filteredStageNodes = stageNodes.filter((n) => n.id !== nodeId)

      // Adjust target index if moving downward
      // When we remove an item before the target position, the target index shifts down by 1
      const adjustedTargetIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex

      // Insert at adjusted target index
      filteredStageNodes.splice(adjustedTargetIndex, 0, draggedNode)

      // Combine back
      return [...otherNodes, ...filteredStageNodes]
    })
  }, [])

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<CampaignNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          }
          return node
        })
      )
    },
    [setNodes]
  )

  const addBlockByClick = useCallback(
    (platform: Platform) => {
      const newCounter = nodeCounter + 1
      setNodeCounter(newCounter)

      // Set default objective based on platform
      const defaultObjective = platform === 'google' ? 'PMAX' : 'LEADS'

      const newNode = {
        id: `campaign-${Date.now()}`,
        type: 'campaign',
        position: { x: 0, y: 0 }, // Position not used anymore
        data: {
          type: 'campaign' as const,
          label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${newCounter}`,
          platform: platform as Platform,
          objective: defaultObjective as any,
          stage: undefined, // No default stage - let it be optional
          dimensions: [],
          multiplier: 1,
          audiences: [],
          onDelete: deleteNodeRef.current!,
        } as CampaignNodeData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [nodeCounter, setNodes]
  )

  const addBlockByDrag = useCallback(
    (platform: string, targetStage: FunnelStage) => {
      const newCounter = nodeCounter + 1
      setNodeCounter(newCounter)

      // Set objective based on target stage
      const defaultObjective = getDefaultObjectiveForStage(targetStage)

      const newNode = {
        id: `campaign-${Date.now()}`,
        type: 'campaign',
        position: { x: 0, y: 0 },
        data: {
          type: 'campaign' as const,
          label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${newCounter}`,
          platform: platform as Platform,
          objective: defaultObjective as any,
          stage: targetStage,
          dimensions: [],
          multiplier: 1,
          audiences: [],
          onDelete: deleteNodeRef.current!,
        } as CampaignNodeData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [nodeCounter, setNodes]
  )

  const handleSaveStrategy = useCallback(async () => {
    if (!strategyName.trim()) {
      alert('Please enter a strategy name')
      return
    }

    setSaving(true)

    try {
      // Get current user - Use a temporary UUID if no auth
      let userId: string
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || '00000000-0000-0000-0000-000000000000'
      } catch {
        // If Supabase auth is not configured, use a temporary UUID
        userId = '00000000-0000-0000-0000-000000000000'
      }

      // Clean nodes data (remove callbacks)
      const cleanedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: undefined,
        },
      }))

      const strategyData = {
        name: strategyName,
        description: strategyDescription || null,
        nodes: cleanedNodes,
        budget_distribution: {
          awareness: awarenessPercentage,
          consideration: considerationPercentage,
          conversion: conversionPercentage,
        },
        user_id: userId,
      }

      if (strategyId) {
        // Update existing strategy
        const { error } = await supabase
          .from('strategies')
          .update(strategyData)
          .eq('id', strategyId)

        if (error) {
          console.error('Supabase UPDATE error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        alert('Strategy updated successfully!')
      } else {
        // Create new strategy
        const { data, error } = await supabase
          .from('strategies')
          .insert([strategyData])
          .select()
          .single()

        if (error) {
          console.error('Supabase INSERT error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        if (data) {
          setStrategyId(data.id)
          // Update URL with strategy ID
          router.push(`/strategy?id=${data.id}`)
        }

        alert('Strategy created successfully!')
      }

      // Reset modal
      setShowSaveModal(false)
    } catch (error) {
      console.error('Error saving strategy:', error)
      alert('Failed to save strategy. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [nodes, strategyName, strategyDescription, strategyId, awarenessPercentage, considerationPercentage, conversionPercentage, supabase, router])

  const openSaveModal = useCallback(() => {
    setShowSaveModal(true)
  }, [])

  // Show loading spinner while loading strategy
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edece5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#151515] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading strategy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#edece5]">
      {/* Header */}
      <div className="border-b border-[#d9d8ce] bg-white px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/strategies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Strategies"
          >
            <ArrowLeft className="h-5 w-5 text-[#151515]" />
          </button>
          <Workflow className="h-6 w-6 text-[#151515]" />
          <div>
            <h1 className="text-xl font-bold text-[#151515]">
              {strategyName || 'Strategy Workflow'}
            </h1>
            <p className="text-sm text-gray-600">
              {strategyId ? 'Edit your marketing funnel strategy' : 'Drag platform blocks to build your flow'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {nodes.filter((n) => n.type === 'campaign').length} campaign blocks
          </div>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              previewMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-[#151515] border border-[#d9d8ce] hover:border-[#151515]'
            }`}
            title={previewMode ? 'Edit Mode' : 'Preview Mode'}
          >
            {previewMode ? (
              <Edit3 className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={openSaveModal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Strategy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Bar - Platform Blocks - Full Width */}
      {!previewMode && (
        <div className="border-b border-[#d9d8ce] bg-white px-6 py-3">
          <PlatformSidebar onAddBlock={addBlockByClick} />
        </div>
      )}

      {/* Main Content - Split: Left (Slider + Columns) | Right (Panel) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {previewMode ? (
          /* Preview Mode - Visual Funnel */
          <FunnelPreview
            nodes={nodes}
            budgetPercentages={{
              awareness: awarenessPercentage,
              consideration: considerationPercentage,
              conversion: conversionPercentage,
            }}
          />
        ) : (
          /* Edit Mode - Left side + Right panel */
          <>
            {/* Left Side: Slider + Columns */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Budget Slider Section - Always visible, cursors only when 3 stages active */}
              <BudgetSlider
                firstCursor={firstCursor}
                secondCursor={secondCursor}
                onFirstCursorChange={setFirstCursor}
                onSecondCursorChange={setSecondCursor}
                labels={{
                  first: 'Awareness',
                  second: 'Consideration',
                  third: 'Conversion',
                }}
                colors={{
                  first: 'bg-blue-50 border-blue-200 text-blue-700',
                  second: 'bg-purple-50 border-purple-200 text-purple-700',
                  third: 'bg-green-50 border-green-200 text-green-700',
                }}
                percentages={{
                  first: awarenessPercentage,
                  second: considerationPercentage,
                  third: conversionPercentage,
                }}
                cursorCount={activeStageCount === 2 ? 1 : activeStageCount === 3 ? 2 : 0}
              />

              {/* Columns Area */}
              <div className="flex-1 flex gap-4 p-4 overflow-auto bg-gray-50 min-h-0">
                <FunnelColumn
                  stage="awareness"
                  title="Awareness"
                  subtitle="Brand Awareness"
                  budgetPercentage={awarenessPercentage}
                  nodes={nodesByStage.awareness}
                  selectedNodeId={selectedNode?.id || null}
                  onNodeClick={onNodeClick}
                  onNodeDrop={handleNodeDrop}
                  onNodeReorder={handleNodeReorder}
                  onAddBlock={addBlockByDrag}
                  bgColor="bg-blue-50/50"
                  borderColor="border-blue-200"
                  titleColor="text-blue-700"
                  subtitleColor="text-blue-600"
                  previewMode={false}
                />

                <FunnelColumn
                  stage="consideration"
                  title="Consideration"
                  subtitle="Traffic & Engagement"
                  budgetPercentage={considerationPercentage}
                  nodes={nodesByStage.consideration}
                  selectedNodeId={selectedNode?.id || null}
                  onNodeClick={onNodeClick}
                  onNodeDrop={handleNodeDrop}
                  onNodeReorder={handleNodeReorder}
                  onAddBlock={addBlockByDrag}
                  bgColor="bg-purple-50/50"
                  borderColor="border-purple-200"
                  titleColor="text-purple-700"
                  subtitleColor="text-purple-600"
                  previewMode={false}
                />

                <FunnelColumn
                  stage="conversion"
                  title="Conversion"
                  subtitle="Leads, Apps & Sales"
                  budgetPercentage={conversionPercentage}
                  nodes={nodesByStage.conversion}
                  selectedNodeId={selectedNode?.id || null}
                  onNodeClick={onNodeClick}
                  onNodeDrop={handleNodeDrop}
                  onNodeReorder={handleNodeReorder}
                  onAddBlock={addBlockByDrag}
                  bgColor="bg-green-50/50"
                  borderColor="border-green-200"
                  titleColor="text-green-700"
                  subtitleColor="text-green-600"
                  previewMode={false}
                />
              </div>
            </div>

            {/* Right Sidebar - Config Panel - Full Height */}
            <div className="flex-shrink-0 bg-white h-full">
              <NodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={updateNodeData}
              />
            </div>
          </>
        )}
      </div>

      {/* Save Strategy Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#151515] mb-4">Save Strategy</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strategy Name *
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="e.g., Q1 2025 Launch Strategy"
                  className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#151515]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  placeholder="Add notes about this strategy..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#d9d8ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#151515] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setStrategyName('')
                  setStrategyDescription('')
                }}
                className="flex-1 px-4 py-2 border border-[#d9d8ce] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStrategy}
                className="flex-1 px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
