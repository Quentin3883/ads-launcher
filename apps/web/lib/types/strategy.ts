export interface Strategy {
  id: string
  name: string
  description: string | null
  nodes: any[] // Campaign nodes from the workflow
  budget_distribution: {
    awareness: number
    consideration: number
    conversion: number
  }
  created_at: string
  updated_at: string
  user_id: string
}

export interface CreateStrategyInput {
  name: string
  description?: string
  nodes: any[]
  budget_distribution?: {
    awareness: number
    consideration: number
    conversion: number
  }
}

export interface UpdateStrategyInput {
  name?: string
  description?: string
  nodes?: any[]
  budget_distribution?: {
    awareness: number
    consideration: number
    conversion: number
  }
}
