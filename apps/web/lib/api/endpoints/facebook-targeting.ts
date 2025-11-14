import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Schemas
const InterestSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience_size_lower_bound: z.number().optional(),
  audience_size_upper_bound: z.number().optional(),
  topic: z.string().optional(),
  path: z.array(z.string()).optional(),
})

const InterestSearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(InterestSchema).optional(),
})

export type Interest = z.infer<typeof InterestSchema>

/**
 * Facebook Targeting API - search interests, behaviors, etc.
 */
export const facebookTargetingAPI = {
  /**
   * Search Facebook interests for targeting
   */
  searchInterests: async (
    userId: string,
    query: string,
    limit: number = 25
  ): Promise<Interest[]> => {
    const response = await fetch(
      `${API_URL}/facebook/targeting/interests/search?userId=${userId}&q=${encodeURIComponent(query)}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to search interests')
    }

    const data = await response.json()
    const validated = InterestSearchResponseSchema.parse(data)

    if (!validated.success) {
      throw new Error('Interest search failed')
    }

    return validated.data || []
  },
}
