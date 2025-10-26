'use client'

import type { CampaignNodeData } from '@/lib/types/strategy-workflow'
import { PLATFORM_CONFIG, META_OBJECTIVES, AUDIENCE_TYPES } from '@/lib/types/strategy-workflow'
import { Target, X, Users } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export function CampaignNode({ data, selected, id }: { data: any; selected?: boolean; id?: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const nodeData = data as CampaignNodeData

  const totalVariants = nodeData.dimensions.reduce((total: number, dim: any) => {
    if (dim.combinationMode === 'multiply') {
      return total === 0 ? dim.variables.length : total * dim.variables.length
    }
    return total + dim.variables.length
  }, 0)

  const campaignCount = totalVariants > 0 ? totalVariants * (nodeData.multiplier || 1) : (nodeData.multiplier || 1)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border transition-all w-full shadow-sm relative group cursor-pointer ${
        selected ? 'border-gray-300 shadow-md ring-2 ring-blue-100' : 'border-gray-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Delete button (appears on hover) */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 z-10 p-1 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Platform Logo */}
        <div className="flex-shrink-0 w-6 h-6 relative bg-gray-50 rounded-lg p-1">
          <Image
            src={`/${nodeData.platform}-logo.svg`}
            alt={`${PLATFORM_CONFIG[nodeData.platform].label} logo`}
            width={16}
            height={16}
            className="object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{nodeData.label}</div>
          <div className="text-xs text-gray-500">{PLATFORM_CONFIG[nodeData.platform].label}</div>
        </div>
      </div>

      {/* Objective Badge */}
      <div className="px-4 pb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
          <Target className="h-3 w-3" />
          {META_OBJECTIVES[nodeData.objective].label}
        </span>
      </div>

      {/* Audiences Preview */}
      {nodeData.audiences && nodeData.audiences.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Audiences</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nodeData.audiences.map((audience: any, index: number) => {
              const audienceType = AUDIENCE_TYPES[audience.type as keyof typeof AUDIENCE_TYPES]
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-medium"
                >
                  <span>{audienceType.icon}</span>
                  {audienceType.label}
                  <span className="font-semibold">×{audience.count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Dimensions Preview */}
      {nodeData.dimensions.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {nodeData.dimensions.slice(0, 4).map((dim: any) => (
              <span
                key={dim.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium"
              >
                {dim.label}
                <span className="font-semibold">×{dim.variables.length}</span>
              </span>
            ))}
            {nodeData.dimensions.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                +{nodeData.dimensions.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer - Campaign Count */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="text-xs text-center">
          <span className="font-semibold text-gray-900">{campaignCount}</span>
          <span className="text-gray-500 ml-1">
            campaign{campaignCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
