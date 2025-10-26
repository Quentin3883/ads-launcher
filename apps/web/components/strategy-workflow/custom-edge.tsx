'use client'

import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface CustomEdgeProps extends EdgeProps {
  data?: {
    onInsertNode?: (sourceId: string, targetId: string) => void
    onDelete?: (edgeId: string) => void
  }
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: CustomEdgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data?.onInsertNode) {
      const [sourceId, targetId] = id.split('-').slice(1) // Extract from "edge-source-target"
      data.onInsertNode(sourceId, targetId)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data?.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isHovered ? 3 : 2,
          stroke: isHovered ? '#151515' : '#d9d8ce',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && (
            <div className="flex items-center gap-1 bg-white border-2 border-[#151515] rounded-lg shadow-lg p-1">
              <button
                onClick={handleInsert}
                className="p-1.5 hover:bg-blue-50 rounded transition-colors group"
                title="Insert block"
              >
                <Plus className="h-3.5 w-3.5 text-blue-600" />
              </button>
              <div className="w-px h-4 bg-[#d9d8ce]" />
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-50 rounded transition-colors group"
                title="Delete connection"
              >
                <X className="h-3.5 w-3.5 text-red-600" />
              </button>
            </div>
          )}
          {!isHovered && (
            <div className="w-8 h-8 bg-transparent cursor-pointer" />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
