/**
 * Utility to get current user ID from URL params or localStorage
 * TODO: Replace with proper authentication system
 */

import { DEFAULT_USER_ID } from '../constants/auth'

export function getUserId(): string {
  if (typeof window === 'undefined') return DEFAULT_USER_ID

  // Try URL params first
  const params = new URLSearchParams(window.location.search)
  const userIdFromUrl = params.get('userId')
  if (userIdFromUrl) return userIdFromUrl

  // Try localStorage
  const userIdFromStorage = localStorage.getItem('facebook_user_id')
  if (userIdFromStorage) return userIdFromStorage

  // Fallback to default
  return DEFAULT_USER_ID
}
