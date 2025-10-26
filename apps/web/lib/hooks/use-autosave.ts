import { useEffect, useRef, useState } from 'react'
import { useClientsStore } from '@/lib/store/clients'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { saveDraft, getDraft, createAutoSaver, hasUnsavedChanges } from '@/lib/utils/storage'

interface UseAutosaveOptions {
  enabled?: boolean
  saveDelay?: number
  draftId?: string
}

export function useAutosave(options: UseAutosaveOptions = {}) {
  const { enabled = true, saveDelay = 2000, draftId = 'current-draft' } = options

  const store = useBulkLauncher()
  const { selectedClientId } = useClientsStore()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedState, setSavedState] = useState<any>(null)

  const autoSaver = useRef(createAutoSaver(saveDelay))

  // Track changes
  const hasChanges = savedState ? hasUnsavedChanges(store, savedState) : false

  // Auto-save on state changes
  useEffect(() => {
    if (!enabled) return

    const currentState = {
      campaign: store.campaign,
      bulkAudiences: store.bulkAudiences,
      bulkCreatives: {
        ...store.bulkCreatives,
        creatives: store.bulkCreatives.creatives.map((c) => ({
          ...c,
          feedVersion: c.feedVersion ? { ...c.feedVersion, file: null } : undefined,
          storyVersion: c.storyVersion ? { ...c.storyVersion, file: null } : undefined,
        })),
      },
      matrixConfig: store.matrixConfig,
      currentStep: store.currentStep,
    }

    setIsSaving(true)
    autoSaver.current(draftId, selectedClientId, currentState)

    // Update last saved after delay
    const timer = setTimeout(() => {
      setLastSaved(new Date())
      setSavedState(currentState)
      setIsSaving(false)
    }, saveDelay + 100)

    return () => clearTimeout(timer)
  }, [
    enabled,
    draftId,
    selectedClientId,
    store.campaign,
    store.bulkAudiences,
    store.bulkCreatives,
    store.matrixConfig,
    store.currentStep,
    saveDelay,
  ])

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return

    const loadDraft = async () => {
      try {
        const draft = await getDraft(draftId)
        if (draft && draft.data) {
          setSavedState(draft.data)
          // Optionally restore state
          // store.restoreState(draft.data)
        }
      } catch (error) {
        console.error('[Autosave] Failed to load draft', error)
      }
    }

    loadDraft()
  }, [enabled, draftId])

  return {
    lastSaved,
    isSaving,
    hasChanges,
  }
}

/**
 * Hook to warn about unsaved changes before leaving
 */
export function useUnsavedChangesWarning(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges])
}

/**
 * Format last saved time as relative string
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 5) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString()
}
