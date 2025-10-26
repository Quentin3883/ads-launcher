import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UseUndoRedoOptions {
  maxHistorySize?: number
}

export interface UndoRedoActions {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  reset: (initialState: any) => void
  push: (newState: any) => void
}

/**
 * Custom hook for undo/redo functionality
 * Tracks state history and provides undo/redo operations
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): [T, UndoRedoActions] {
  const { maxHistorySize = 50 } = options

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  // Track if state change is from undo/redo to avoid adding to history
  const isUndoRedoRef = useRef(false)

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  const undo = useCallback(() => {
    if (!canUndo) return

    isUndoRedoRef.current = true
    setHistory((prev) => {
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, prev.past.length - 1)

      return {
        past: newPast,
        present: previous!,
        future: [prev.present, ...prev.future],
      }
    })

    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 0)
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    isUndoRedoRef.current = true
    setHistory((prev) => {
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)

      return {
        past: [...prev.past, prev.present],
        present: next!,
        future: newFuture,
      }
    })

    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 0)
  }, [canRedo])

  const push = useCallback(
    (newState: T) => {
      // Skip if this is from undo/redo
      if (isUndoRedoRef.current) return

      setHistory((prev) => {
        let newPast = [...prev.past, prev.present]

        // Trim history if it exceeds max size
        if (newPast.length > maxHistorySize) {
          newPast = newPast.slice(newPast.length - maxHistorySize)
        }

        return {
          past: newPast,
          present: newState,
          future: [], // Clear future on new action
        }
      })
    },
    [maxHistorySize]
  )

  const reset = useCallback((newInitialState: T) => {
    setHistory({
      past: [],
      present: newInitialState,
      future: [],
    })
  }, [])

  const actions: UndoRedoActions = {
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
    push,
  }

  return [history.present, actions]
}

/**
 * Hook for tracking bulk operations (add/remove) with undo/redo
 */
export function useBulkOperationHistory<T extends { id: string }>(initialItems: T[]) {
  const [items, { canUndo, canRedo, undo, redo, push, reset }] = useUndoRedo<T[]>(initialItems)

  const addItem = useCallback(
    (item: T) => {
      const newItems = [...items, item]
      push(newItems)
      return newItems
    },
    [items, push]
  )

  const removeItem = useCallback(
    (id: string) => {
      const newItems = items.filter((item) => item.id !== id)
      push(newItems)
      return newItems
    },
    [items, push]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<T>) => {
      const newItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item))
      push(newItems)
      return newItems
    },
    [items, push]
  )

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
  }
}
