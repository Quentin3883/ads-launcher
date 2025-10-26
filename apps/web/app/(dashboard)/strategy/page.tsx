'use client'

import { useCallback, useState, useRef } from 'react'
import { CampaignNode } from '@/components/strategy-workflow/campaign-node'
import { PlatformSidebar } from '@/components/strategy-workflow/platform-sidebar'
import { NodeConfigPanel } from '@/components/strategy-workflow/node-config-panel'
import type { CampaignNodeData, Platform } from '@/lib/types/strategy-workflow'
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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'campaign') {
      setSelectedNode(node)
    }
  }, [])

  // Map Meta objectives to funnel stages
  const getStageFromObjective = (objective: string): 'awareness' | 'consideration' | 'conversion' => {
    switch (objective) {
      case 'AWARENESS':
        return 'awareness'
      case 'TRAFFIC':
      case 'ENGAGEMENT':
        return 'consideration'
      case 'LEADS':
      case 'APP_PROMOTION':
      case 'SALES':
        return 'conversion'
      default:
        return 'awareness'
    }
  }

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
          {/* React Flow Canvas with Fixed Columns */}
          <div className="flex-1 flex gap-4 p-4 overflow-auto bg-gray-50">
          {/* Awareness Column */}
          <div className="flex-1 min-w-[300px] bg-blue-50/50 border-2 border-blue-200 rounded-xl p-4">
            <div className="mb-4 pb-3 border-b-2 border-blue-200">
              <h3 className="text-base font-semibold text-blue-700">Awareness</h3>
              <p className="text-xs text-blue-600">Brand Awareness</p>
            </div>
            <div className="space-y-4">
              {nodes
                .filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'awareness')
                .map((node) => (
                  <div key={node.id} onClick={() => onNodeClick({} as any, node)}>
                    <CampaignNode
                      data={node.data}
                      selected={selectedNode?.id === node.id}
                      id={node.id}
                    />
                  </div>
                ))}
              {nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'awareness').length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 italic">
                  No campaigns yet
                </div>
              )}
            </div>
          </div>

          {/* Consideration Column */}
          <div className="flex-1 min-w-[300px] bg-purple-50/50 border-2 border-purple-200 rounded-xl p-4">
            <div className="mb-4 pb-3 border-b-2 border-purple-200">
              <h3 className="text-base font-semibold text-purple-700">Consideration</h3>
              <p className="text-xs text-purple-600">Traffic & Engagement</p>
            </div>
            <div className="space-y-4">
              {nodes
                .filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'consideration')
                .map((node) => (
                  <div key={node.id} onClick={() => onNodeClick({} as any, node)}>
                    <CampaignNode
                      data={node.data}
                      selected={selectedNode?.id === node.id}
                      id={node.id}
                    />
                  </div>
                ))}
              {nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'consideration').length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 italic">
                  No campaigns yet
                </div>
              )}
            </div>
          </div>

          {/* Conversion Column */}
          <div className="flex-1 min-w-[300px] bg-green-50/50 border-2 border-green-200 rounded-xl p-4">
            <div className="mb-4 pb-3 border-b-2 border-green-200">
              <h3 className="text-base font-semibold text-green-700">Conversion</h3>
              <p className="text-xs text-green-600">Leads, Apps & Sales</p>
            </div>
            <div className="space-y-4">
              {nodes
                .filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'conversion')
                .map((node) => (
                  <div key={node.id} onClick={() => onNodeClick({} as any, node)}>
                    <CampaignNode
                      data={node.data}
                      selected={selectedNode?.id === node.id}
                      id={node.id}
                    />
                  </div>
                ))}
              {nodes.filter((node) => node.type === 'campaign' && getStageFromObjective(node.data.objective) === 'conversion').length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 italic">
                  No campaigns yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Config Panel (always visible) */}
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNodeData}
        />
      </div>
    </div>

      {/* Node Configuration Panel - Old modal version, replaced by sidebar */}
      {false && selectedNode && selectedNode.type === 'campaign' && selectedNode !== null && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNodeData}
        />
      )}

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
