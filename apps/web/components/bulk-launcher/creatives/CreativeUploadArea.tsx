import { Upload, Library, Plus } from 'lucide-react'
import { Button, ds } from '../ui/shadcn'

interface CreativeUploadAreaProps {
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (files: FileList | null) => void
  onOpenVideoLibrary: () => void
  onOpenImageLibrary: () => void
  onAddEmpty: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

/**
 * Upload area component with drag & drop, library access, and add empty creative
 */
export function CreativeUploadArea({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onOpenVideoLibrary,
  onOpenImageLibrary,
  onAddEmpty,
  fileInputRef,
}: CreativeUploadAreaProps) {
  return (
    <div className={ds.cn('flex', ds.spacing.gap.sm)}>
      {/* Upload Zone - Compact */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={ds.cn(
          'flex-1 rounded-lg border-2 border-dashed text-center cursor-pointer transition-all',
          ds.spacing.padding.md,
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50'
        )}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
        <p className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>
          Drop files or click to upload
        </p>
        <p className={ds.cn(ds.typography.caption, 'text-muted-foreground mt-0.5')}>
          Support: -Feed / -Story suffixes
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => onFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Browse Library Buttons */}
      <Button
        onClick={onOpenVideoLibrary}
        variant="outline"
        className={ds.cn(
          'flex flex-col items-center justify-center rounded-lg min-w-[100px]',
          ds.spacing.gap.xs,
          ds.spacing.padding.sm
        )}
      >
        <Library className="h-5 w-5" />
        <span className={ds.typography.caption}>Videos</span>
      </Button>

      <Button
        onClick={onOpenImageLibrary}
        variant="outline"
        className={ds.cn(
          'flex flex-col items-center justify-center rounded-lg min-w-[100px]',
          ds.spacing.gap.xs,
          ds.spacing.padding.sm
        )}
      >
        <Library className="h-5 w-5" />
        <span className={ds.typography.caption}>Images</span>
      </Button>

      {/* Add Empty Creative */}
      <Button
        onClick={onAddEmpty}
        variant="outline"
        className={ds.cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed min-w-[100px]',
          ds.spacing.gap.xs,
          ds.spacing.padding.sm
        )}
      >
        <Plus className="h-5 w-5" />
        <span className={ds.cn(ds.typography.caption, 'font-medium')}>New</span>
      </Button>
    </div>
  )
}
