'use client'

import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { Check, Loader2, X, Film } from 'lucide-react'

export function UploadProgressList() {
  const { uploadProgress } = useBulkLauncher()

  if (uploadProgress.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {uploadProgress.map((upload) => (
        <div key={upload.id} className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {upload.status === 'completed' ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : upload.status === 'error' ? (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </div>
            ) : (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
          </div>

          {/* File name and progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{upload.fileName}</span>
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {upload.status === 'completed' ? '100%' : `${Math.round(upload.progress)}%`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  upload.status === 'completed'
                    ? 'bg-green-500'
                    : upload.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>

            {/* Status text */}
            {upload.phase && upload.status !== 'completed' && upload.status !== 'error' && (
              <p className="text-xs text-muted-foreground mt-1">
                {upload.phase === 'starting' && 'Preparing upload...'}
                {upload.phase === 'transferring' && 'Uploading...'}
                {upload.phase === 'finalizing' && 'Finalizing upload...'}
                {upload.phase === 'processing' && 'Processing video...'}
              </p>
            )}

            {/* Error message */}
            {upload.error && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
