// @ts-nocheck - Complex workflow types, will be refactored
'use client'

import type { CampaignNodeData } from '@/lib/constants/workflow'
import { PLATFORM_CONFIG, META_OBJECTIVES, GOOGLE_CAMPAIGN_TYPES, AUDIENCE_TYPES } from '@/lib/constants/workflow'
import { Target, X, Users } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export function CampaignNode({ data, selected, id }: { data: any; selected?: boolean; id?: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const nodeData = data as CampaignNodeData

  const handleDelete = () => {
    if (nodeData.onDelete && id) {
      nodeData.onDelete(id)
    }
  }

  const handleClick = () => {
    if (nodeData.onSelect && id) {
      nodeData.onSelect(id)
    }
  }

  // Calculate number of campaigns (combinations)
  const campaignCount =
    nodeData.audiences.length * nodeData.dimensions.length * (nodeData.multiplier || 1)

  const getObjectiveLabel = () => {
    if (nodeData.platform === 'meta') {
      return META_OBJECTIVES[nodeData.objective]?.label || nodeData.objective
    } else if (nodeData.platform === 'google') {
      return GOOGLE_CAMPAIGN_TYPES[nodeData.objective]?.label || nodeData.objective
    }
    return nodeData.objective
  }

  return (
    <div
      className={`bg-white rounded-xl border transition-all w-full relative group cursor-pointer ${
        selected
          ? 'border-gray-300 shadow-lg ring-2 ring-gray-200 ring-opacity-50'
          : 'border-gray-200 shadow-sm hover:shadow-md'
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete button - shows on hover */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 z-10 p-1 bg-white border border-gray-200 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        {/* Platform logo */}
        <div className="flex-shrink-0 w-6 h-6 relative">
          <Image
            src={`/${nodeData.platform}-logo.svg`}
            alt={nodeData.platform}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>

        {/* Label and objective */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{nodeData.label}</div>
          <div className="text-xs text-gray-500 truncate">{getObjectiveLabel()}</div>
        </div>
      </div>

      {/* Body - Targeting info */}
      <div className="px-3 py-2 space-y-2">
        {/* Audiences */}
        <div className="flex items-start gap-1.5">
          <Users className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-700 mb-0.5">Audiences</div>
            <div className="text-xs text-gray-500 line-clamp-2">
              {nodeData.audiences.length > 0
                ? nodeData.audiences
                    .map((a) => {
                      const audienceType = AUDIENCE_TYPES[a.type]
                      return audienceType ? `${a.count}x ${audienceType.label}` : 'Unknown'
                    })
                    .join(', ')
                : 'No audiences selected'}
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="flex items-start gap-1.5">
          <Target className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-700 mb-0.5">Dimensions</div>
            <div className="text-xs text-gray-500 line-clamp-2">
              {nodeData.dimensions.length > 0
                ? nodeData.dimensions.map((d) => `${d.label} (${d.variableCount})`).join(', ')
                : 'No dimensions selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="text-xs text-center text-gray-600 font-medium">
          {campaignCount} {campaignCount === 1 ? 'campaign' : 'campaigns'}
        </div>
      </div>
    </div>
  )
}
