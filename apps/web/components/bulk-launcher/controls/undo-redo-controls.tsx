'use client'

import { Undo2, Redo2 } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'

export function UndoRedoControls() {
  const { canUndo, canRedo, undo, redo, history } = useBulkLauncher()

  const canUndoValue = canUndo()
  const canRedoValue = canRedo()

  if (!canUndoValue && !canRedoValue) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30">
      <button
        onClick={undo}
        disabled={!canUndoValue}
        className="p-1.5 rounded hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={`Undo (${history.past.length} actions)`}
      >
        <Undo2 className="h-4 w-4 text-foreground" />
      </button>

      <div className="h-4 w-px bg-border" />

      <button
        onClick={redo}
        disabled={!canRedoValue}
        className="p-1.5 rounded hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={`Redo (${history.future.length} actions)`}
      >
        <Redo2 className="h-4 w-4 text-foreground" />
      </button>

      <div className="text-xs text-muted-foreground">
        {history.past.length > 0 && `${history.past.length} ${history.past.length === 1 ? 'action' : 'actions'}`}
      </div>
    </div>
  )
}
