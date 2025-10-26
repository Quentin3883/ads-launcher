/**
 * Strategy Workflow - Node-based visual strategy builder (N8N-style)
 * Allows flexible campaign structures with splits, branches, and per-node dimensions
 */

import type { Node, Edge } from '@xyflow/react'

// ========== BASE TYPES ==========

export type Platform = 'meta' | 'google' | 'linkedin' | 'tiktok'

export type MetaObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

export type FunnelStage = 'awareness' | 'consideration' | 'conversion'

// ========== NODE TYPES ==========

export type NodeType =
  | 'start'           // Point de départ
  | 'campaign'        // Bloc campagne avec dimensions
  | 'split'           // Split en N branches
  | 'merge'           // Merge de plusieurs branches
  | 'end'             // Point de fin

// ========== DIMENSION PER NODE ==========

export interface NodeDimension {
  id: string
  type: 'value_proposition' | 'region' | 'audience' | 'creative' | 'custom'
  label: string
  variableCount: number
  variables: {
    id: string
    label: string
    weight?: number
  }[]
  combinationMode: 'multiply' | 'separate'  // multiply = combinaisons, separate = 1 campaign par variable
}

// ========== AUDIENCE TYPES ==========

export type AudienceType = 'broad' | 'interest' | 'custom'

export interface AudienceConfig {
  type: AudienceType
  count: number  // Number of audiences of this type
}

// ========== NODE DATA ==========

export interface StartNodeData {
  type: 'start'
  label: string
}

export interface CampaignNodeData {
  type: 'campaign'
  label: string
  stage?: FunnelStage
  platform: Platform
  objective: MetaObjective
  dimensions: NodeDimension[]
  multiplier: number  // Ex: "2 campaigns" même sans dimensions
  audiences: AudienceConfig[]  // Audience configuration
  onDelete?: (nodeId: string) => void  // Callback for node deletion
}

export interface SplitNodeData {
  type: 'split'
  label: string
  branches: number  // Nombre de branches en sortie
}

export interface MergeNodeData {
  type: 'merge'
  label: string
}

export interface EndNodeData {
  type: 'end'
  label: string
}

export type StrategyNodeData =
  | StartNodeData
  | CampaignNodeData
  | SplitNodeData
  | MergeNodeData
  | EndNodeData

// ========== WORKFLOW ==========

export interface StrategyWorkflow {
  id: string
  name: string
  description?: string
  nodes: Node<StrategyNodeData>[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

// ========== CAMPAIGN CALCULATION ==========

export interface CalculatedCampaign {
  id: string
  path: string[]  // List of node IDs in the path
  name: string
  platform: Platform
  objective: MetaObjective
  stage?: FunnelStage
  dimensions: Record<string, string>  // dimensionId -> variableId
  estimatedAdSets: number
  estimatedAds: number
}

export interface WorkflowCalculationResult {
  totalCampaigns: number
  totalAdSets: number
  totalAds: number
  campaigns: CalculatedCampaign[]
  paths: {
    pathId: string
    nodeIds: string[]
    campaignCount: number
  }[]
}

// ========== CALCULATION FUNCTION ==========

export function calculateWorkflowCampaigns(workflow: StrategyWorkflow): WorkflowCalculationResult {
  const campaigns: CalculatedCampaign[] = []
  const paths: { pathId: string; nodeIds: string[]; campaignCount: number }[] = []

  // Find all paths from start to end
  const allPaths = findAllPaths(workflow.nodes, workflow.edges)

  allPaths.forEach((path, pathIndex) => {
    const pathCampaigns = calculatePathCampaigns(path, workflow.nodes)

    paths.push({
      pathId: `path_${pathIndex + 1}`,
      nodeIds: path,
      campaignCount: pathCampaigns.length,
    })

    campaigns.push(...pathCampaigns)
  })

  return {
    totalCampaigns: campaigns.length,
    totalAdSets: campaigns.reduce((sum, c) => sum + c.estimatedAdSets, 0),
    totalAds: campaigns.reduce((sum, c) => sum + c.estimatedAds, 0),
    campaigns,
    paths,
  }
}

function findAllPaths(nodes: Node<StrategyNodeData>[], edges: Edge[]): string[][] {
  const startNode = nodes.find(n => n.data.type === 'start')
  if (!startNode) return []

  const paths: string[][] = []
  const visited = new Set<string>()

  function dfs(nodeId: string, currentPath: string[]) {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    currentPath.push(nodeId)
    visited.add(nodeId)

    // If end node or no outgoing edges, save path
    if (node.data.type === 'end' || !edges.some(e => e.source === nodeId)) {
      paths.push([...currentPath])
    } else {
      // Continue to next nodes
      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => {
        if (!visited.has(edge.target)) {
          dfs(edge.target, [...currentPath])
        }
      })
    }
  }

  dfs(startNode.id, [])
  return paths
}

function calculatePathCampaigns(
  path: string[],
  nodes: Node<StrategyNodeData>[]
): CalculatedCampaign[] {
  const campaigns: CalculatedCampaign[] = []

  // Get campaign nodes in this path
  const campaignNodes = path
    .map(nodeId => nodes.find(n => n.id === nodeId))
    .filter(n => n && n.data.type === 'campaign') as Node<CampaignNodeData>[]

  if (campaignNodes.length === 0) return []

  // For each campaign node, generate campaigns based on dimensions and multiplier
  campaignNodes.forEach((node, idx) => {
    const nodeData = node.data
    const baseCampaignCount = nodeData.multiplier || 1

    // Calculate dimension combinations
    const dimensionCombos = calculateDimensionCombinations(nodeData.dimensions)

    // Generate campaigns
    if (dimensionCombos.length === 0) {
      // No dimensions, just use multiplier
      for (let i = 0; i < baseCampaignCount; i++) {
        campaigns.push({
          id: `campaign_${campaigns.length + 1}`,
          path,
          name: `${nodeData.label} ${i + 1}`,
          platform: nodeData.platform,
          objective: nodeData.objective,
          stage: nodeData.stage,
          dimensions: {},
          estimatedAdSets: 3,
          estimatedAds: 9,
        })
      }
    } else {
      // With dimensions
      dimensionCombos.forEach((combo, comboIdx) => {
        for (let i = 0; i < baseCampaignCount; i++) {
          const dimensionLabels = Object.entries(combo)
            .map(([dimId, varId]) => {
              const dim = nodeData.dimensions.find(d => d.id === dimId)
              const variable = dim?.variables.find(v => v.id === varId)
              return variable?.label || ''
            })
            .filter(Boolean)

          campaigns.push({
            id: `campaign_${campaigns.length + 1}`,
            path,
            name: `${nodeData.label} ${dimensionLabels.join(' × ')}${baseCampaignCount > 1 ? ` #${i + 1}` : ''}`,
            platform: nodeData.platform,
            objective: nodeData.objective,
            stage: nodeData.stage,
            dimensions: combo,
            estimatedAdSets: 3,
            estimatedAds: 9,
          })
        }
      })
    }
  })

  return campaigns
}

function calculateDimensionCombinations(
  dimensions: NodeDimension[]
): Record<string, string>[] {
  if (dimensions.length === 0) return []

  const multiplyDims = dimensions.filter(d => d.combinationMode === 'multiply')
  const separateDims = dimensions.filter(d => d.combinationMode === 'separate')

  let combinations: Record<string, string>[] = [{}]

  // Full factorial for multiply mode
  multiplyDims.forEach(dim => {
    const newCombinations: Record<string, string>[] = []
    combinations.forEach(combo => {
      dim.variables.forEach(variable => {
        newCombinations.push({
          ...combo,
          [dim.id]: variable.id,
        })
      })
    })
    combinations = newCombinations
  })

  // Separate mode: one combination per variable
  separateDims.forEach(dim => {
    dim.variables.forEach(variable => {
      combinations.push({
        [dim.id]: variable.id,
      })
    })
  })

  return combinations.length > 0 ? combinations : []
}

// ========== PLATFORM & OBJECTIVE CONFIGS ==========

export const PLATFORM_CONFIG: Record<Platform, {
  label: string
  available: boolean
  color: string
}> = {
  meta: { label: 'Meta Ads', available: true, color: '#0084FF' },
  google: { label: 'Google Ads', available: false, color: '#4285F4' },
  linkedin: { label: 'LinkedIn Ads', available: false, color: '#0A66C2' },
  tiktok: { label: 'TikTok Ads', available: false, color: '#000000' },
}

export const META_OBJECTIVES: Record<MetaObjective, { label: string }> = {
  AWARENESS: { label: 'Brand Awareness' },
  TRAFFIC: { label: 'Traffic' },
  ENGAGEMENT: { label: 'Engagement' },
  LEADS: { label: 'Lead Generation' },
  APP_PROMOTION: { label: 'App Promotion' },
  SALES: { label: 'Sales' },
}

export const FUNNEL_STAGES: Record<FunnelStage, { label: string; color: string }> = {
  awareness: { label: 'Awareness', color: '#3B82F6' },
  consideration: { label: 'Consideration', color: '#8B5CF6' },
  conversion: { label: 'Conversion', color: '#10B981' },
}

export const AUDIENCE_TYPES: Record<AudienceType, { label: string; description: string; icon: string }> = {
  broad: {
    label: 'Broad',
    description: 'Large general audience',
    icon: '🌐'
  },
  interest: {
    label: 'Interest',
    description: 'Interest-based targeting',
    icon: '🎯'
  },
  custom: {
    label: 'Custom',
    description: 'Custom or lookalike audiences',
    icon: '👥'
  },
}
