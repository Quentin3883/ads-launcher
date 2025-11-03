'use client'

import { useState } from 'react'
import type { FunnelStage } from '@/lib/types/workflow'
import { CampaignNode } from './campaign-node'

type Node = {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

interface FunnelColumnProps {
  stage: FunnelStage
  title: string
  subtitle: string
  budgetPercentage?: number
  nodes: Node[]
  selectedNodeId: string | null
  onNodeClick: (node: Node) => void
  onNodeDrop: (nodeId: string, targetStage: FunnelStage) => void
  onNodeReorder?: (nodeId: string, targetIndex: number, stage: FunnelStage) => void
  onAddBlock?: (platform: string, targetStage: FunnelStage) => void
  bgColor: string
  borderColor: string
  titleColor: string
  subtitleColor: string
  previewMode?: boolean
}

export function FunnelColumn({
  stage,
  title,
  subtitle,
  budgetPercentage,
  nodes,
  selectedNodeId,
  onNodeClick,
  onNodeDrop,
  onNodeReorder,
  onAddBlock,
  bgColor,
  borderColor,
  titleColor,
  subtitleColor,
  previewMode = false,
}: FunnelColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverIndex(null)

    const nodeId = e.dataTransfer.getData('nodeId')
    const sourceStage = e.dataTransfer.getData('sourceStage')
    const platform = e.dataTransfer.getData('platform')
    const isNewBlock = e.dataTransfer.getData('isNewBlock')

    if (isNewBlock === 'true' && platform && onAddBlock) {
      // Creating new block from platform sidebar
      onAddBlock(platform, stage)
    } else if (nodeId) {
      // If dropping from different stage, change stage
      if (sourceStage !== stage) {
        onNodeDrop(nodeId, stage)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('nodeId', nodeId)
    e.dataTransfer.setData('sourceStage', stage)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleNodeDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(index)
  }

  const handleNodeDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)

    const nodeId = e.dataTransfer.getData('nodeId')
    const sourceStage = e.dataTransfer.getData('sourceStage')
    const platform = e.dataTransfer.getData('platform')
    const isNewBlock = e.dataTransfer.getData('isNewBlock')

    if (isNewBlock === 'true' && platform && onAddBlock) {
      // Creating new block from platform sidebar at specific position
      onAddBlock(platform, stage)
    } else if (nodeId) {
      // If same stage, reorder
      if (sourceStage === stage && onNodeReorder) {
        onNodeReorder(nodeId, targetIndex, stage)
      } else {
        // Different stage, change stage (existing behavior)
        onNodeDrop(nodeId, stage)
      }
    }
  }

  return (
    <div
      className={`flex-1 min-w-[300px] h-fit ${bgColor} border-2 ${borderColor} rounded-xl p-4 transition-all ${
        !previewMode && isDragOver ? 'ring-4 ring-blue-400 scale-[1.02]' : ''
      }`}
      onDragOver={previewMode ? undefined : handleDragOver}
      onDragLeave={previewMode ? undefined : handleDragLeave}
      onDrop={previewMode ? undefined : handleDrop}
    >
      <div className={`mb-4 pb-3 border-b-2 ${borderColor}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className={`text-base font-semibold ${titleColor}`}>{title}</h3>
            <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>
          </div>
          {budgetPercentage !== undefined && (
            <div className="text-right">
              <div className={`text-[10px] font-medium ${subtitleColor} uppercase tracking-wide`}>% Budget</div>
              <div className={`text-2xl font-bold ${titleColor} leading-tight mt-0.5`}>
                {budgetPercentage}%
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            draggable={!previewMode}
            onDragStart={previewMode ? undefined : (e) => handleDragStart(e, node.id)}
            onDragOver={previewMode ? undefined : (e) => handleNodeDragOver(e, index)}
            onDrop={previewMode ? undefined : (e) => handleNodeDrop(e, index)}
            onClick={() => onNodeClick(node)}
            className={`${previewMode ? 'cursor-default' : 'cursor-move'} ${
              dragOverIndex === index ? 'border-t-4 border-blue-500 pt-4' : ''
            }`}
          >
            <CampaignNode
              data={node.data}
              selected={selectedNodeId === node.id}
              id={node.id}
            />
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 italic">
            No campaigns yet
            {!previewMode && <p className="text-xs mt-1">Drag blocks here</p>}
          </div>
        )}
      </div>
    </div>
  )
}
