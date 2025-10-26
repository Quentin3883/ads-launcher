'use client'

import { useState, useRef } from 'react'
import { Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import {
  exportBlueprint,
  downloadBlueprint,
  validateBlueprint,
  importBlueprint,
  readBlueprintFile,
} from '@/lib/utils/blueprint'
import type { LaunchBlueprint } from '@/lib/types/blueprint'

export function BlueprintActions() {
  const store = useBulkLauncher()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleExport = () => {
    const blueprint = exportBlueprint(store, {
      name: store.campaign.name || 'Campaign Blueprint',
      description: `Blueprint for ${store.campaign.country} campaign`,
    })

    downloadBlueprint(blueprint)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setValidationResult(null)

    try {
      const blueprint: LaunchBlueprint = await readBlueprintFile(file)
      const validation = validateBlueprint(blueprint)

      setValidationResult(validation)

      if (validation.isValid) {
        // Apply blueprint to current state
        const partialState = importBlueprint(blueprint)
        Object.entries(partialState).forEach(([key, value]) => {
          if (key === 'campaign') {
            store.updateCampaign(value as any)
          } else if (key === 'bulkAudiences') {
            store.updateBulkAudiences(value as any)
          } else if (key === 'matrixConfig') {
            // Update matrix config if needed
          }
        })

        alert('✅ Blueprint imported successfully!\n\nNote: Creative files need to be re-uploaded.')
      } else {
        alert(`❌ Blueprint validation failed:\n\n${validation.errors.join('\n')}`)
      }
    } catch (error) {
      alert(`Failed to import blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Export Button */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
        title="Export as Blueprint JSON"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Import Button */}
      <button
        onClick={handleImportClick}
        disabled={importing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Import Blueprint JSON"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import'}</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Validation Result */}
      {validationResult && (
        <div className="flex items-center gap-2 ml-2">
          {validationResult.isValid ? (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Invalid
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Blueprint info display for metadata
 */
interface BlueprintInfoProps {
  blueprint: LaunchBlueprint
}

export function BlueprintInfo({ blueprint }: BlueprintInfoProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileJson className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-foreground">{blueprint.metadata.name}</h4>
      </div>

      {blueprint.metadata.description && (
        <p className="text-sm text-muted-foreground">{blueprint.metadata.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Version:</span>
          <span className="ml-1 font-mono">{blueprint.version}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Created:</span>
          <span className="ml-1">{new Date(blueprint.metadata.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Country:</span>
          <span className="ml-1">{blueprint.campaign.country}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Objective:</span>
          <span className="ml-1">{blueprint.campaign.objective}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
        <span>{blueprint.audiences.presets.length} audiences</span>
        <span>•</span>
        <span>{blueprint.creatives.length} creatives</span>
        <span>•</span>
        <span>{blueprint.placements.length} placements</span>
      </div>
    </div>
  )
}
