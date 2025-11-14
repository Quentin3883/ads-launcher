'use client'

import { useEffect, useRef } from 'react'

interface AutoJumpConfig {
  enabled: boolean
  currentSubPage: number
  totalSubPages: number
  onJumpToNext: () => void
  dependencies: any[] // Values to watch for completion
  isComplete: (deps: any[]) => boolean // Function to determine if current sub-page is complete
}

/**
 * Hook for auto-jumping to the next sub-page when current one is complete
 *
 * @example
 * useAutoJump({
 *   enabled: true,
 *   currentSubPage: 0,
 *   totalSubPages: 5,
 *   onJumpToNext: () => setCurrentSubPage(1),
 *   dependencies: [facebookPageId],
 *   isComplete: (deps) => !!deps[0]
 * })
 */
export function useAutoJump({
  enabled,
  currentSubPage,
  totalSubPages,
  onJumpToNext,
  dependencies,
  isComplete,
}: AutoJumpConfig) {
  const hasJumped = useRef(false)
  const previousDeps = useRef(dependencies)

  useEffect(() => {
    if (!enabled) return
    if (currentSubPage >= totalSubPages - 1) return // Don't jump from last sub-page
    if (hasJumped.current) return // Already jumped for this sub-page

    // Check if dependencies changed (user filled something)
    const depsChanged = dependencies.some(
      (dep, index) => dep !== previousDeps.current[index]
    )

    if (depsChanged && isComplete(dependencies)) {
      // Small delay to let user see the value before jumping
      const timer = setTimeout(() => {
        onJumpToNext()
        hasJumped.current = true
      }, 300)

      return () => clearTimeout(timer)
    }

    previousDeps.current = dependencies
  }, [enabled, currentSubPage, totalSubPages, onJumpToNext, dependencies, isComplete])

  // Reset hasJumped when sub-page changes (manual navigation)
  useEffect(() => {
    hasJumped.current = false
  }, [currentSubPage])
}
