import type { FunnelStage } from '@/lib/types/strategy-workflow'
import { CampaignNode } from './campaign-node'

type Node = {
  id: string
  type: string
  data: any
}

interface FunnelColumnProps {
  stage: FunnelStage
  title: string
  subtitle: string
  nodes: Node[]
  selectedNodeId: string | null
  onNodeClick: (node: Node) => void
  bgColor: string
  borderColor: string
  titleColor: string
  subtitleColor: string
}

export function FunnelColumn({
  stage,
  title,
  subtitle,
  nodes,
  selectedNodeId,
  onNodeClick,
  bgColor,
  borderColor,
  titleColor,
  subtitleColor,
}: FunnelColumnProps) {
  return (
    <div className={`flex-1 min-w-[300px] ${bgColor} border-2 ${borderColor} rounded-xl p-4`}>
      <div className={`mb-4 pb-3 border-b-2 ${borderColor}`}>
        <h3 className={`text-base font-semibold ${titleColor}`}>{title}</h3>
        <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>
      </div>
      <div className="space-y-4">
        {nodes.map((node) => (
          <div key={node.id} onClick={() => onNodeClick(node)}>
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
          </div>
        )}
      </div>
    </div>
  )
}
