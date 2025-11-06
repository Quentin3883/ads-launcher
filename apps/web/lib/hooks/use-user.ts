'use client'

import { useMemo } from 'react'
import { DEFAULT_USER_ID, DEFAULT_USER } from '../constants/auth'
import { getUserId } from '../utils/get-user-id'

export interface User {
  id: string
  email: string
  name: string
  firstName: string
}

/**
 * Hook to get current user info
 * TODO: Replace with proper auth system - fetch from API
 */
export function useUser(): User | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null

    const userId = getUserId()

    // Hardcoded user data for development
    if (userId === DEFAULT_USER_ID) {
      const firstName = DEFAULT_USER.name.split(' ')[0] || 'User'

      return {
        ...DEFAULT_USER,
        firstName,
      }
    }

    return null
  }, [])
}
