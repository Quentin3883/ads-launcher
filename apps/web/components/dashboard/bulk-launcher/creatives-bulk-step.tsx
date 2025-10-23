'use client'

import { useState, useRef } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CTA_OPTIONS, generateId } from '@/lib/types/bulk-launcher'
import type { Creative, CreativeVersion } from '@/lib/types/bulk-launcher'
import { Upload, Trash2, Plus, X, Monitor, Smartphone } from 'lucide-react'

export function CreativesBulkStep() {
  const {
    bulkCreatives,
    updateBulkCreatives,
    addCreative,
    removeCreative,
    updateCreative,
    addCopyVariant,
    removeCopyVariant,
    getMatrixStats,
  } = useBulkLauncher()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const stats = getMatrixStats()

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const creativeMap: Record<string, { feed?: File; story?: File; name: string }> = {}

    // Group files by base name (without feed/story suffix)
    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return

      const fileName = file.name.replace(/\.[^/.]+$/, '')
      let baseName = fileName
      let type: 'feed' | 'story' | 'unknown' = 'unknown'

      // Detect Feed variants: "_Feed", "_feed", " - Feed", "-Feed"
      if (/([-_\s]+feed)$/i.test(fileName)) {
        baseName = fileName.replace(/([-_\s]+feed)$/i, '').trim()
        type = 'feed'
      }
      // Detect Story variants: "_Story", "_story", " - Story", "-Story"
      else if (/([-_\s]+story)$/i.test(fileName)) {
        baseName = fileName.replace(/([-_\s]+story)$/i, '').trim()
        type = 'story'
      }

      if (!creativeMap[baseName]) {
        creativeMap[baseName] = { name: baseName }
      }

      if (type === 'feed') {
        creativeMap[baseName]!.feed = file
      } else if (type === 'story') {
        creativeMap[baseName]!.story = file
      } else {
        // If no suffix, treat as feed by default
        creativeMap[baseName]!.feed = file
      }
    })

    // Create creatives
    Object.entries(creativeMap).forEach(([_baseName, { feed, story, name }]) => {
      const format = feed?.type.startsWith('video/') || story?.type.startsWith('video/') ? 'Video' : 'Image'

      const creative: Creative = {
        id: generateId(),
        name,
        format,
        feedVersion: feed
          ? {
              file: feed,
              url: URL.createObjectURL(feed),
              thumbnail: URL.createObjectURL(feed),
            }
          : undefined,
        storyVersion: story
          ? {
              file: story,
              url: URL.createObjectURL(story),
              thumbnail: URL.createObjectURL(story),
            }
          : undefined,
      }

      addCreative(creative)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleAssignFile = (creativeId: string, type: 'feed' | 'story', file: File) => {
    const version: CreativeVersion = {
      file,
      url: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
    }

    const format = file.type.startsWith('video/') ? 'Video' : 'Image'

    updateCreative(creativeId, {
      format,
      [type === 'feed' ? 'feedVersion' : 'storyVersion']: version,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Creatives & Copies</h3>
          <p className="text-sm text-muted-foreground">Upload files • Auto-groups: "BR - SMS - Feed.png" + "BR - SMS - Story.png"</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <div className="text-xs text-muted-foreground">Total Ads</div>
          <div className="text-2xl font-bold text-primary">{stats.totalAds}</div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50'
        }`}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h4 className="text-sm font-semibold text-foreground mb-1">Drop files here or click to upload</h4>
        <p className="text-xs text-muted-foreground">Support: -Feed / -Story, _feed / _story, - Feed / - Story</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Creatives Grid */}
      {bulkCreatives.creatives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Creatives ({bulkCreatives.creatives.length})</h4>

          <div className="space-y-2">
            {bulkCreatives.creatives.map((creative) => (
              <div key={creative.id} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  {/* Creative Name + Delete */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={creative.name}
                      onChange={(e) => updateCreative(creative.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                    />
                  </div>

                  {/* Feed Preview */}
                  <div className="relative group">
                    {creative.feedVersion ? (
                      <div className="w-16 h-16 rounded border border-border overflow-hidden bg-muted">
                        {creative.format === 'Video' ? (
                          <video src={creative.feedVersion.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={creative.feedVersion.url} alt="Feed" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => updateCreative(creative.id, { feedVersion: undefined })}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 cursor-pointer flex flex-col items-center justify-center">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground mt-0.5">Feed</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAssignFile(creative.id, 'feed', file)
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Story Preview */}
                  <div className="relative group">
                    {creative.storyVersion ? (
                      <div className="w-9 h-16 rounded border border-border overflow-hidden bg-muted">
                        {creative.format === 'Video' ? (
                          <video src={creative.storyVersion.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={creative.storyVersion.url} alt="Story" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => updateCreative(creative.id, { storyVersion: undefined })}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-9 h-16 rounded border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 cursor-pointer flex flex-col items-center justify-center">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground mt-0.5">Story</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAssignFile(creative.id, 'story', file)
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Delete Creative */}
                  <button
                    onClick={() => removeCreative(creative.id)}
                    className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy Section */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Ad Copy</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkCreatives.sameCopyForAll}
              onChange={(e) => updateBulkCreatives({ sameCopyForAll: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-xs text-foreground">Same for all</span>
          </label>
        </div>

        {bulkCreatives.sameCopyForAll ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Headline (40)</label>
              <input
                type="text"
                maxLength={40}
                value={bulkCreatives.globalHeadline || ''}
                onChange={(e) => updateBulkCreatives({ globalHeadline: e.target.value })}
                placeholder="Your headline"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Primary Text (125)</label>
              <input
                type="text"
                maxLength={125}
                value={bulkCreatives.globalPrimaryText || ''}
                onChange={(e) => updateBulkCreatives({ globalPrimaryText: e.target.value })}
                placeholder="Your message"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">CTA</label>
              <select
                value={bulkCreatives.globalCTA || 'Learn More'}
                onChange={(e) => updateBulkCreatives({ globalCTA: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {CTA_OPTIONS.map((cta) => (
                  <option key={cta} value={cta}>
                    {cta}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Individual copy editing per creative coming soon...</p>
        )}
      </div>

      {/* Copy Variants */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Copy Variants (A/B Test)</h4>
            <p className="text-[10px] text-muted-foreground">Multiply ads for testing</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkCreatives.enableVariants}
              onChange={(e) => updateBulkCreatives({ enableVariants: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-xs text-foreground">Enable</span>
          </label>
        </div>

        {bulkCreatives.enableVariants && (
          <div className="space-y-2">
            {(bulkCreatives.copyVariants || []).map((variant) => (
              <div key={variant.id} className="flex items-center gap-2">
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
                  className="w-16 px-2 py-1 text-xs font-semibold rounded border border-border bg-background"
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
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-border bg-background"
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
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-border bg-background"
                />
                <select
                  value={variant.cta}
                  onChange={(e) => {
                    const updated = bulkCreatives.copyVariants?.map((v) =>
                      v.id === variant.id ? { ...v, cta: e.target.value } : v
                    )
                    updateBulkCreatives({ copyVariants: updated })
                  }}
                  className="w-32 px-2 py-1.5 text-xs rounded border border-border bg-background"
                >
                  {CTA_OPTIONS.map((cta) => (
                    <option key={cta} value={cta}>
                      {cta}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeCopyVariant(variant.id)}
                  className="p-1.5 rounded text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() =>
                addCopyVariant({
                  id: generateId(),
                  name: `VP-${String.fromCharCode(65 + (bulkCreatives.copyVariants?.length || 0))}`,
                  headline: '',
                  primaryText: '',
                  cta: 'Learn More',
                })
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted transition-colors text-xs w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
