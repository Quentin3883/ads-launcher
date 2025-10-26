'use client'

import { useCallback, useState, useRef, useMemo } from 'react'
import { PlatformSidebar } from '@/components/strategy-workflow/platform-sidebar'
import { NodeConfigPanel } from '@/components/strategy-workflow/node-config-panel'
import { FunnelColumn } from '@/components/strategy-workflow/funnel-column'
import type { CampaignNodeData, Platform } from '@/lib/types/strategy-workflow'
import { getStageFromObjective } from '@/lib/utils/strategy-workflow'
import { Workflow, Save } from 'lucide-react'

type Node = {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

export default function StrategyWorkflowPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodeCounter, setNodeCounter] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [strategyDescription, setStrategyDescription] = useState('')

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

      const newNode = {
        id: `campaign-${Date.now()}`,
        type: 'campaign',
        position: { x: 0, y: 0 }, // Position not used anymore
        data: {
          type: 'campaign' as const,
          label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${newCounter}`,
          platform: platform as Platform,
          objective: 'LEADS' as const,
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

  const handleSaveStrategy = useCallback(() => {
    if (!strategyName.trim()) {
      alert('Please enter a strategy name')
      return
    }

    // Clean nodes data (remove callbacks)
    const cleanedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: undefined,
      },
    }))

    const strategy = {
      id: `strategy-${Date.now()}`,
      name: strategyName,
      description: strategyDescription,
      nodes: cleanedNodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to localStorage for now (will be replaced with API call later)
    const savedStrategies = JSON.parse(localStorage.getItem('strategies') || '[]')
    savedStrategies.push(strategy)
    localStorage.setItem('strategies', JSON.stringify(savedStrategies))

    // Reset modal
    setShowSaveModal(false)
    setStrategyName('')
    setStrategyDescription('')

    alert('Strategy saved successfully!')
  }, [nodes, strategyName, strategyDescription])

  const openSaveModal = useCallback(() => {
    setShowSaveModal(true)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#edece5]">
      {/* Header */}
      <div className="border-b border-[#d9d8ce] bg-white px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Workflow className="h-6 w-6 text-[#151515]" />
          <div>
            <h1 className="text-xl font-bold text-[#151515]">Strategy Workflow</h1>
            <p className="text-sm text-gray-600">Drag platform blocks to build your flow</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {nodes.filter((n) => n.type === 'campaign').length} campaign blocks
          </div>
          <button
            onClick={openSaveModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Strategy
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Platform Blocks */}
        <div className="border-b border-[#d9d8ce] bg-white px-6 py-3">
          <PlatformSidebar onAddBlock={addBlockByClick} />
        </div>

        {/* Columns Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Funnel Columns */}
          <div className="flex-1 flex gap-4 p-4 overflow-auto bg-gray-50">
            <FunnelColumn
              stage="awareness"
              title="Awareness"
              subtitle="Brand Awareness"
              nodes={nodesByStage.awareness}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={onNodeClick}
              bgColor="bg-blue-50/50"
              borderColor="border-blue-200"
              titleColor="text-blue-700"
              subtitleColor="text-blue-600"
            />

            <FunnelColumn
              stage="consideration"
              title="Consideration"
              subtitle="Traffic & Engagement"
              nodes={nodesByStage.consideration}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={onNodeClick}
              bgColor="bg-purple-50/50"
              borderColor="border-purple-200"
              titleColor="text-purple-700"
              subtitleColor="text-purple-600"
            />

            <FunnelColumn
              stage="conversion"
              title="Conversion"
              subtitle="Leads, Apps & Sales"
              nodes={nodesByStage.conversion}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={onNodeClick}
              bgColor="bg-green-50/50"
              borderColor="border-green-200"
              titleColor="text-green-700"
              subtitleColor="text-green-600"
            />
          </div>

        {/* Right Sidebar - Config Panel (always visible) */}
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNodeData}
        />
      </div>
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
