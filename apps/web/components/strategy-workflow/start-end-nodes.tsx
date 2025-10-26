'use client'

import { Handle, Position } from '@xyflow/react'
import { Play, Target } from 'lucide-react'

export function StartNode() {
  return (
    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
      <Play className="h-6 w-6 text-white fill-white" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-600" />
    </div>
  )
}

export function EndNode() {
  return (
    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 shadow-lg">
      <Target className="h-6 w-6 text-white" />
      <Handle type="target" position={Position.Top} className="!bg-red-600" />
    </div>
  )
}
