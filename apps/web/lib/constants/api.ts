/**
 * API configuration constants
 */

export const API_BASE_URL = typeof window !== 'undefined'
  ? 'http://localhost:4000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`
