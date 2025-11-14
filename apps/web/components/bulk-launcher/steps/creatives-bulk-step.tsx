'use client'

import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CTA_OPTIONS, generateId, hasDynamicParams, getPreviewText } from '@launcher-ads/sdk'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { MediaLibraryModal } from '../media-library-modal'
import { FormSection, Input, Select, ds, Button } from '../ui/shadcn'
import { Textarea } from '@/components/ui/textarea'
import { useCreativeFileUpload } from '../hooks/use-creative-file-upload'
import { useMediaLibrary } from '../hooks/use-media-library'
import { CreativeUploadArea } from '../creatives/CreativeUploadArea'
import { CreativeCard } from '../creatives/CreativeCard'

export function CreativesBulkStep() {
  const {
    bulkCreatives,
    updateBulkCreatives,
    removeCreative,
    updateCreative,
    addCopyVariant,
    removeCopyVariant,
    adAccountId,
  } = useBulkLauncher()

  const [expandedCreativeId, setExpandedCreativeId] = useState<string | null>(null)

  // Use extracted hooks
  const fileUpload = useCreativeFileUpload()
  const mediaLibrary = useMediaLibrary()

  const handleAddEmptyCreative = () => {
    const creative = {
      id: generateId(),
      name: `Creative ${bulkCreatives.creatives.length + 1}`,
      format: 'Image' as const,
      label: 'Static' as const,
    }
    // Access addCreative from store
    const store = useBulkLauncher.getState()
    store.addCreative(creative)
  }

  return (
    <div className={ds.spacing.vertical.md}>
      {/* Header + Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={ds.typography.pageTitle}>Creatives & Copies</h3>
          <p className={ds.componentPresets.hint}>Upload files • Auto-groups: "Name - Feed.png" + "Name - Story.png"</p>
        </div>
        <div className={ds.cn('rounded-lg border border-primary/30 bg-primary/5', ds.spacing.padding.sm)}>
          <div className={ds.cn(ds.typography.caption, 'text-muted-foreground')}>Creatives</div>
          <div className="text-xl font-bold text-primary">{bulkCreatives.creatives.length}</div>
        </div>
      </div>

      {/* Actions Row */}
      <CreativeUploadArea
        dragOver={fileUpload.dragOver}
        onDragOver={(e) => {
          e.preventDefault()
          fileUpload.setDragOver(true)
        }}
        onDragLeave={() => fileUpload.setDragOver(false)}
        onDrop={fileUpload.handleDrop}
        onFileSelect={fileUpload.handleFileSelect}
        onOpenVideoLibrary={() => mediaLibrary.openMediaLibrary('video')}
        onOpenImageLibrary={() => mediaLibrary.openMediaLibrary('image')}
        onAddEmpty={handleAddEmptyCreative}
        fileInputRef={fileUpload.fileInputRef}
      />

      {/* Creatives Grid */}
      {bulkCreatives.creatives.length > 0 && (
        <div className={ds.spacing.vertical.sm}>
          <h4 className={ds.cn(ds.typography.cardTitle, 'text-foreground')}>Creatives ({bulkCreatives.creatives.length})</h4>

          <div className={ds.spacing.vertical.xs}>
            {bulkCreatives.creatives.map((creative) => (
              <CreativeCard
                key={creative.id}
                creative={creative}
                isExpanded={expandedCreativeId === creative.id}
                onToggleExpand={() => setExpandedCreativeId(expandedCreativeId === creative.id ? null : creative.id)}
                onUpdateName={(name) => updateCreative(creative.id, { name })}
                onUpdateLabel={(label) => updateCreative(creative.id, { label })}
                onAssignFeedFile={(file) => fileUpload.handleAssignFile(creative.id, 'feed', file)}
                onAssignStoryFile={(file) => fileUpload.handleAssignFile(creative.id, 'story', file)}
                onOpenFeedLibrary={(type) => mediaLibrary.openMediaLibrary(type, creative.id, 'feed')}
                onOpenStoryLibrary={(type) => mediaLibrary.openMediaLibrary(type, creative.id, 'story')}
                onRemoveFeed={() => updateCreative(creative.id, { feedVersion: undefined })}
                onRemoveStory={() => updateCreative(creative.id, { storyVersion: undefined })}
                onDelete={() => removeCreative(creative.id)}
              >
                {/* Expandable Copy Fields */}
                <div className={ds.cn('mt-2 pt-2 border-t border-border', ds.spacing.vertical.sm)}>
                  <div className={ds.cn('flex items-center gap-2 mb-1.5', ds.typography.caption, 'font-medium text-muted-foreground')}>
                    <span>Optional Copy (overrides copy variants)</span>
                    <div className={ds.cn('flex items-center', ds.spacing.gap.xs, 'text-blue-600')}>
                      <Sparkles className="h-3 w-3" />
                      <span>Supports {'{{city}}'}, {'{{label}}'}, {'{{country}}'}</span>
                    </div>
                  </div>
                  <div className={ds.cn('grid grid-cols-2', ds.spacing.gap.sm)}>
                    <div>
                      <Input
                        label="Headline"
                        maxLength={255}
                        value={creative.headline || ''}
                        onChange={(val) => updateCreative(creative.id, { headline: val || undefined })}
                        placeholder="Override headline for this creative..."
                      />
                      {creative.headline && hasDynamicParams(creative.headline) && (
                        <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                          <p className={ds.cn(ds.typography.caption, 'text-blue-600 font-medium')}>Preview:</p>
                          <p className={ds.cn(ds.typography.caption, 'text-blue-700')}>{getPreviewText(creative.headline)}</p>
                        </div>
                      )}
                    </div>
                    <Select
                      label="CTA"
                      value={creative.cta || ''}
                      onChange={(val) => updateCreative(creative.id, { cta: val || undefined })}
                      options={[
                        { value: '', label: '(Clear - use global)' },
                        ...CTA_OPTIONS.map((cta) => ({ value: cta, label: cta }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className={ds.componentPresets.label}>Primary Text</label>
                    <Textarea
                      maxLength={2000}
                      value={creative.primaryText || ''}
                      onChange={(e) => updateCreative(creative.id, { primaryText: e.target.value || undefined })}
                      placeholder="Override primary text for this creative..."
                      rows={2}
                      className={ds.cn(ds.typography.body)}
                    />
                    {creative.primaryText && hasDynamicParams(creative.primaryText) && (
                      <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                        <p className={ds.cn(ds.typography.caption, 'text-blue-600 font-medium')}>Preview:</p>
                        <p className={ds.cn(ds.typography.caption, 'text-blue-700')}>{getPreviewText(creative.primaryText)}</p>
                      </div>
                    )}
                  </div>
                  <Input
                    label="Description"
                    maxLength={255}
                    value={creative.description || ''}
                    onChange={(val) => updateCreative(creative.id, { description: val || undefined })}
                    placeholder="Optional description..."
                  />
                </div>
              </CreativeCard>
            ))}
          </div>
        </div>
      )}

      {/* Copy Section */}
      <FormSection title="Ad Copy">
        <div className={ds.spacing.vertical.md}>
          <div className={ds.cn('grid grid-cols-3', ds.spacing.gap.md)}>
            <div>
              <Input
                label="Headline"
                maxLength={40}
                value={bulkCreatives.globalHeadline || ''}
                onChange={(val) => {
                  const previousValue = bulkCreatives.globalHeadline
                  updateBulkCreatives({ globalHeadline: val })

                  // Auto-apply to creatives that either:
                  // 1. Have no headline (empty)
                  // 2. Have the previous global headline (were synced before)
                  bulkCreatives.creatives.forEach((creative) => {
                    if (!creative.headline || creative.headline === previousValue) {
                      updateCreative(creative.id, { headline: val })
                    }
                  })
                }}
                placeholder="Your headline"
              />
              {bulkCreatives.globalHeadline && hasDynamicParams(bulkCreatives.globalHeadline) && (
                <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                  <p className={ds.cn(ds.typography.caption, 'text-blue-600 font-medium')}>Preview:</p>
                  <p className={ds.cn(ds.typography.caption, 'text-blue-700')}>{getPreviewText(bulkCreatives.globalHeadline)}</p>
                </div>
              )}
            </div>
            <div>
              <Input
                label="Primary Text"
                maxLength={125}
                value={bulkCreatives.globalPrimaryText || ''}
                onChange={(val) => {
                  const previousValue = bulkCreatives.globalPrimaryText
                  updateBulkCreatives({ globalPrimaryText: val })

                  // Auto-apply to creatives that either:
                  // 1. Have no primaryText (empty)
                  // 2. Have the previous global primaryText (were synced before)
                  bulkCreatives.creatives.forEach((creative) => {
                    if (!creative.primaryText || creative.primaryText === previousValue) {
                      updateCreative(creative.id, { primaryText: val })
                    }
                  })
                }}
                placeholder="Your message"
              />
              {bulkCreatives.globalPrimaryText && hasDynamicParams(bulkCreatives.globalPrimaryText) && (
                <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                  <p className={ds.cn(ds.typography.caption, 'text-blue-600 font-medium')}>Preview:</p>
                  <p className={ds.cn(ds.typography.caption, 'text-blue-700')}>{getPreviewText(bulkCreatives.globalPrimaryText)}</p>
                </div>
              )}
            </div>
            <Select
              label="CTA"
              value={bulkCreatives.globalCTA || 'Learn More'}
              onChange={(val) => {
                const previousValue = bulkCreatives.globalCTA
                updateBulkCreatives({ globalCTA: val })

                // Auto-apply to creatives that either:
                // 1. Have no CTA (empty)
                // 2. Have the previous global CTA (were synced before)
                bulkCreatives.creatives.forEach((creative) => {
                  if (!creative.cta || creative.cta === previousValue) {
                    updateCreative(creative.id, { cta: val })
                  }
                })
              }}
              options={CTA_OPTIONS.map((cta) => ({ value: cta, label: cta }))}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                // Apply global copy to all creatives (override any existing specific wording)
                bulkCreatives.creatives.forEach((creative) => {
                  updateCreative(creative.id, {
                    headline: bulkCreatives.globalHeadline,
                    primaryText: bulkCreatives.globalPrimaryText,
                    cta: bulkCreatives.globalCTA,
                  })
                })
              }}
              className={ds.cn(
                'px-3 py-1.5 rounded-md',
                ds.typography.caption
              )}
            >
              Apply to All
            </Button>
          </div>
        </div>
      </FormSection>

      {/* Copy Variants */}
      <FormSection
        title="Copy Variants"
        badge={bulkCreatives.enableVariants ? 'Enabled' : undefined}
        headerContent={
          <label className={ds.cn('flex items-center cursor-pointer', ds.spacing.gap.sm)}>
            <input
              type="checkbox"
              checked={bulkCreatives.enableVariants}
              onChange={(e) => updateBulkCreatives({ enableVariants: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
            />
            <span className={ds.cn(ds.typography.caption, 'text-foreground font-medium')}>Enable</span>
          </label>
        }
      >
        {bulkCreatives.enableVariants && (
          <div className={ds.spacing.vertical.sm}>
            {(bulkCreatives.copyVariants || []).map((variant) => (
              <div key={variant.id} className={ds.cn('flex items-center', ds.spacing.gap.sm)}>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => {
                    const updated = bulkCreatives.copyVariants?.map((v) =>
                      v.id === variant.id ? { ...v, name: e.target.value } : v
                    )
                    updateBulkCreatives({ copyVariants: updated })
                  }}
                  placeholder="VP-A"
                  className={ds.cn('w-16 px-2 py-1 font-semibold rounded border border-border bg-background', ds.typography.caption)}
                />
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Headline"
                  value={variant.headline}
                  onChange={(e) => {
                    const updated = bulkCreatives.copyVariants?.map((v) =>
                      v.id === variant.id ? { ...v, headline: e.target.value } : v
                    )
                    updateBulkCreatives({ copyVariants: updated })
                  }}
                  className={ds.cn('flex-1 px-3 py-1.5 rounded border border-border bg-background', ds.typography.caption)}
                />
                <input
                  type="text"
                  maxLength={125}
                  placeholder="Primary text"
                  value={variant.primaryText}
                  onChange={(e) => {
                    const updated = bulkCreatives.copyVariants?.map((v) =>
                      v.id === variant.id ? { ...v, primaryText: e.target.value } : v
                    )
                    updateBulkCreatives({ copyVariants: updated })
                  }}
                  className={ds.cn('flex-1 px-3 py-1.5 rounded border border-border bg-background', ds.typography.caption)}
                />
                <select
                  value={variant.cta}
                  onChange={(e) => {
                    const updated = bulkCreatives.copyVariants?.map((v) =>
                      v.id === variant.id ? { ...v, cta: e.target.value } : v
                    )
                    updateBulkCreatives({ copyVariants: updated })
                  }}
                  className={ds.cn('w-32 px-2 py-1.5 rounded border border-border bg-background', ds.typography.caption)}
                >
                  {CTA_OPTIONS.map((cta) => (
                    <option key={cta} value={cta}>
                      {cta}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => removeCopyVariant(variant.id)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 rounded text-destructive hover:bg-destructive/10 h-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              onClick={() =>
                addCopyVariant({
                  id: generateId(),
                  name: `VP-${String.fromCharCode(65 + (bulkCreatives.copyVariants?.length || 0))}`,
                  headline: '',
                  primaryText: '',
                  cta: 'Learn More',
                })
              }
              variant="outline"
              className={ds.cn(
                'flex items-center justify-center w-full px-3 py-1.5 rounded-lg border-dashed',
                ds.spacing.gap.sm,
                ds.typography.caption
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </Button>
          </div>
        )}
      </FormSection>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={mediaLibrary.showMediaLibrary}
        onClose={mediaLibrary.closeMediaLibrary}
        adAccountId={adAccountId || ''}
        type={mediaLibrary.mediaLibraryType}
        targetCreativeId={mediaLibrary.targetCreativeId}
        targetSlot={mediaLibrary.targetSlot}
        onAssign={mediaLibrary.handleAssignFromLibrary}
      />
    </div>
  )
}
