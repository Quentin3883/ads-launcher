'use client'

import { Handle, Position } from '@xyflow/react'
import type { SplitNodeData } from '@/lib/types/strategy-workflow'
import { GitBranch } from 'lucide-react'

export function SplitNode({ data, selected }: { data: any; selected?: boolean }) {
  const nodeData = data as SplitNodeData
  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all ${
        selected ? 'border-[#151515] shadow-lg' : 'border-[#d9d8ce]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#151515]" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <GitBranch className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#151515]">{nodeData.label}</div>
          <div className="text-xs text-gray-600">{nodeData.branches} branches</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#151515]" />
    </div>
  )
}
