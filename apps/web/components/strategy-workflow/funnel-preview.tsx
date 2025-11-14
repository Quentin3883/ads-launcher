// @ts-nocheck - Complex workflow types, will be refactored
'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { PLATFORM_CONFIG, AUDIENCE_TYPES, type FunnelStage } from '@/lib/constants/workflow'
import { getStageFromObjective } from '@/lib/utils/workflow'

type Node = {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

interface FunnelPreviewProps {
  nodes: Node[]
  budgetPercentages?: {
    awareness: number
    consideration: number
    conversion: number
  }
}

export function FunnelPreview({ nodes, budgetPercentages }: FunnelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardPositions, setCardPositions] = useState<Map<string, DOMRect>>(new Map())

  // Group nodes by stage
  const nodesByStage = useMemo(() => {
    const grouped = {
      awareness: [] as Node[],
      consideration: [] as Node[],
      conversion: [] as Node[],
    }

    nodes.forEach((node) => {
      if (node.type === 'campaign' && node.data.objective) {
        const stage = getStageFromObjective(node.data.objective)
        grouped[stage].push(node)
      }
    })

    return grouped
  }, [nodes])

  const stages: { key: FunnelStage; title: string; color: string; lightColor: string }[] = [
    { key: 'awareness', title: 'Awareness', color: '#3B82F6', lightColor: '#DBEAFE' },
    { key: 'consideration', title: 'Consideration', color: '#8B5CF6', lightColor: '#EDE9FE' },
    { key: 'conversion', title: 'Conversion', color: '#10B981', lightColor: '#D1FAE5' },
  ]

  // Update card positions when layout changes
  useEffect(() => {
    const updatePositions = () => {
      const newPositions = new Map<string, DOMRect>()
      const cards = containerRef.current?.querySelectorAll('[data-card-id]')
      cards?.forEach((card) => {
        const id = card.getAttribute('data-card-id')
        if (id) {
          newPositions.set(id, card.getBoundingClientRect())
        }
      })
      setCardPositions(newPositions)
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    setTimeout(updatePositions, 100)

    return () => window.removeEventListener('resize', updatePositions)
  }, [nodesByStage])

  // Generate stage-to-stage connections
  const stageConnections = useMemo(() => {
    const conns: Array<{
      fromStage: FunnelStage
      toStage: FunnelStage
      color: string
    }> = []

    if (nodesByStage.awareness.length > 0 && nodesByStage.consideration.length > 0) {
      conns.push({
        fromStage: 'awareness',
        toStage: 'consideration',
        color: '#8B5CF6',
      })
    }

    if (nodesByStage.consideration.length > 0 && nodesByStage.conversion.length > 0) {
      conns.push({
        fromStage: 'consideration',
        toStage: 'conversion',
        color: '#10B981',
      })
    }

    return conns
  }, [nodesByStage])

  return (
    <div className="h-full w-full bg-white p-4 overflow-auto">
      <div className="w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#151515] mb-2">Marketing Funnel Strategy</h2>
          <p className="text-gray-600">Customer journey visualization with audience targeting</p>
        </div>

        {/* Funnel Flow */}
        <div className="relative" ref={containerRef}>
          {/* SVG for connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrowhead-purple"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#8B5CF6" />
              </marker>
              <marker
                id="arrowhead-green"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#10B981" />
              </marker>
            </defs>
            {stageConnections.map((conn, idx) => {
              const fromStageNodes = nodesByStage[conn.fromStage]
              const toStageNodes = nodesByStage[conn.toStage]

              if (fromStageNodes.length === 0 || toStageNodes.length === 0) return null

              const containerRect = containerRef.current?.getBoundingClientRect()
              if (!containerRect) return null

              const paths: JSX.Element[] = []

              // Group connections by their Y positions to merge overlapping lines
              const connectionGroups = new Map<string, Array<{fromY: number, toY: number, x1: number, x2: number}>>()

              fromStageNodes.forEach((fromNode) => {
                const fromRect = cardPositions.get(fromNode.id)
                if (!fromRect) return

                toStageNodes.forEach((toNode) => {
                  const toRect = cardPositions.get(toNode.id)
                  if (!toRect) return

                  const x1 = fromRect.right - containerRect.left
                  const y1 = fromRect.top + fromRect.height / 2 - containerRect.top
                  const x2 = toRect.left - containerRect.left
                  const y2 = toRect.top + toRect.height / 2 - containerRect.top

                  // Round Y positions to group similar paths (tolerance of 5px)
                  const yKey = `${Math.round(y1 / 5) * 5}-${Math.round(y2 / 5) * 5}`

                  if (!connectionGroups.has(yKey)) {
                    connectionGroups.set(yKey, [])
                  }
                  connectionGroups.get(yKey)!.push({ fromY: y1, toY: y2, x1, x2 })
                })
              })

              // Draw one path per group (merged lines)
              let groupIndex = 0
              connectionGroups.forEach((group, yKey) => {
                if (!group[0]) return
                // Use average positions for the merged path
                const avgFromY = group.reduce((sum, conn) => sum + conn.fromY, 0) / group.length
                const avgToY = group.reduce((sum, conn) => sum + conn.toY, 0) / group.length
                const x1 = group[0].x1
                const x2 = group[0].x2

                const midX = (x1 + x2) / 2

                // Path with sharp 90-degree turns (no rounding)
                let path = `M ${x1} ${avgFromY} `

                if (Math.abs(avgToY - avgFromY) < 5) {
                  // Straight horizontal line if on same level
                  path += `L ${x2} ${avgToY}`
                } else {
                  // Sharp 90-degree corners
                  path += `L ${midX} ${avgFromY} `
                  path += `L ${midX} ${avgToY} `
                  path += `L ${x2} ${avgToY}`
                }

                const markerId = conn.color === '#8B5CF6' ? 'arrowhead-purple' : 'arrowhead-green'

                paths.push(
                  <path
                    key={`${conn.fromStage}-${conn.toStage}-group-${groupIndex}`}
                    d={path}
                    stroke={conn.color}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                    markerEnd={`url(#${markerId})`}
                  />
                )
                groupIndex++
              })

              return paths
            })}
          </svg>

          {/* Stage columns */}
          <div className="flex items-start justify-center gap-20 relative" style={{ zIndex: 1 }}>
            {stages.map((stage, stageIndex) => {
              const stageNodes = nodesByStage[stage.key]
              const hasNodes = stageNodes.length > 0

              return (
                <div key={stage.key} className="w-56 relative">
                  {/* Stage header */}
                  <div className="text-center mb-6">
                    <div
                      className="inline-block px-5 py-2 rounded-full text-white font-medium text-sm shadow-sm mb-2"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.title}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{stageNodes.length} campaigns</div>
                    {budgetPercentages && (
                      <div className="text-center">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">% Budget</div>
                        <div className="text-2xl font-bold mt-0.5" style={{ color: stage.color }}>
                          {budgetPercentages[stage.key]}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campaigns */}
                  <div className="space-y-4">
                    {stageNodes.map((node, nodeIndex) => (
                      <div key={node.id} className="relative">
                        {/* Campaign card */}
                        <div
                          data-card-id={node.id}
                          className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-all relative"
                          style={{ borderColor: stage.color, borderWidth: '1.5px' }}
                        >
                          {/* Connection dots */}
                          {stageIndex > 0 && (
                            <div
                              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white z-20"
                              style={{ borderColor: stage.color }}
                            />
                          )}
                          {stageIndex < stages.length - 1 && hasNodes && (
                            <div
                              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white z-20"
                              style={{ borderColor: stage.color }}
                            />
                          )}

                          {/* Platform logo and name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: stage.lightColor }}>
                              <Image
                                src={`/${node.data.platform}-logo.svg`}
                                alt={`${PLATFORM_CONFIG[node.data.platform as keyof typeof PLATFORM_CONFIG]?.label} logo`}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-[#151515] truncate">{node.data.label}</div>
                              <div className="text-xs text-gray-500">
                                {PLATFORM_CONFIG[node.data.platform as keyof typeof PLATFORM_CONFIG]?.label}
                              </div>
                            </div>
                          </div>

                          {/* Audiences */}
                          {node.data.audiences && node.data.audiences.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-semibold text-gray-600">Audiences:</div>
                              {node.data.audiences.map((aud: any, audIndex: number) => (
                                <div
                                  key={audIndex}
                                  className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1.5"
                                >
                                  <span className="text-base">{AUDIENCE_TYPES[aud.type as keyof typeof AUDIENCE_TYPES]?.icon}</span>
                                  <span className="flex-1 font-medium text-gray-700">
                                    {AUDIENCE_TYPES[aud.type as keyof typeof AUDIENCE_TYPES]?.label}
                                  </span>
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                    ×{aud.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Dimensions */}
                          {node.data.dimensions && node.data.dimensions.length > 0 && (
                            <div className="mt-2.5 pt-2.5 border-t">
                              <div className="text-xs font-semibold text-gray-600 mb-1.5">Dimensions:</div>
                              <div className="flex flex-wrap gap-1">
                                {node.data.dimensions.map((dim: any) => (
                                  <span
                                    key={dim.id}
                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium"
                                  >
                                    {dim.label} ({dim.variableCount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty state */}
                    {!hasNodes && (
                      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                        <p className="text-gray-400 text-xs">No campaigns in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
