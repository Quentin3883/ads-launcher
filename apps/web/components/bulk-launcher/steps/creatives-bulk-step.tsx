'use client'

import { useState, useRef } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CTA_OPTIONS, generateId, hasDynamicParams, getPreviewText } from '@launcher-ads/sdk'
import type { Creative, CreativeVersion, CreativeLabel } from '@launcher-ads/sdk'
import { Upload, Trash2, Plus, X, Monitor, Smartphone, Library, ChevronDown, Sparkles } from 'lucide-react'
import { MediaLibraryModal } from '../media-library-modal'
import { FormSection, Input, Select, ds, Button } from '../ui/shadcn'
import { Textarea } from '@/components/ui/textarea'

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
    adAccountId,
  } = useBulkLauncher()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [mediaLibraryType, setMediaLibraryType] = useState<'image' | 'video'>('video')
  const [targetCreativeId, setTargetCreativeId] = useState<string | undefined>()
  const [targetSlot, setTargetSlot] = useState<'feed' | 'story' | undefined>()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [expandedCreativeId, setExpandedCreativeId] = useState<string | null>(null)

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

      // Auto-detect label: Image -> Static, Video -> check for UGC in filename, otherwise Video
      let label: CreativeLabel = 'Static'
      if (format === 'Video') {
        const hasUGC = /ugc/i.test(name)
        label = hasUGC ? 'UGC' : 'Video'
      }

      const creative: Creative = {
        id: generateId(),
        name,
        format,
        label,
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
    const creative = bulkCreatives.creatives.find((c) => c.id === creativeId)
    if (!creative) return

    const newFormat = file.type.startsWith('video/') ? 'Video' : 'Image'

    // Check if mixing image/video in same creative
    const otherSlot = type === 'feed' ? creative.storyVersion : creative.feedVersion
    if (otherSlot && creative.format !== newFormat) {
      alert('Cannot mix images and videos in the same creative. Please use the same format for both Feed and Story.')
      return
    }

    const blobUrl = URL.createObjectURL(file)

    const version: CreativeVersion = {
      file,
      url: blobUrl,
      thumbnail: blobUrl,
    }

    // Auto-fill creative name from file name (remove extension)
    const fileName = file.name.replace(/\.[^/.]+$/, '')
    const newName = creative.name.startsWith('Creative ') || creative.name.startsWith('Library ')
      ? fileName
      : creative.name

    updateCreative(creativeId, {
      name: newName,
      format: newFormat,
      [type === 'feed' ? 'feedVersion' : 'storyVersion']: version,
    })
  }

  const handleAssignFromLibrary = (
    mediaUrl: string,
    thumbnailUrl: string | undefined,
    format: 'Feed' | 'Story' | 'Both',
    mediaType: 'image' | 'video'
  ) => {
    // If targeting a specific creative and slot, update it
    if (targetCreativeId && targetSlot) {
      const creative = bulkCreatives.creatives.find((c) => c.id === targetCreativeId)
      if (!creative) return

      const newFormat = mediaType === 'image' ? 'Image' : 'Video'

      // Check if mixing image/video in same creative
      const otherSlot = targetSlot === 'feed' ? creative.storyVersion : creative.feedVersion
      if (otherSlot && creative.format !== newFormat) {
        alert('Cannot mix images and videos in the same creative. Please use the same format for both Feed and Story.')
        return
      }

      const version: CreativeVersion = {
        url: mediaUrl,
        thumbnail: thumbnailUrl,
      }

      updateCreative(targetCreativeId, {
        format: newFormat,
        [targetSlot === 'feed' ? 'feedVersion' : 'storyVersion']: version,
      })
    } else {
      // Otherwise create a new creative
      const name = `Library ${mediaType} ${Date.now()}`

      const creative: Creative = {
        id: generateId(),
        name,
        format: mediaType === 'image' ? 'Image' : 'Video',
        label: mediaType === 'image' ? 'Static' : 'Video',
      }

      if (format === 'Feed' || format === 'Both') {
        creative.feedVersion = {
          url: mediaUrl,
          thumbnail: thumbnailUrl,
        }
      }

      if (format === 'Story' || format === 'Both') {
        creative.storyVersion = {
          url: mediaUrl,
          thumbnail: thumbnailUrl,
        }
      }

      addCreative(creative)
    }

    // Reset targeting
    setTargetCreativeId(undefined)
    setTargetSlot(undefined)
  }

  const handleAddEmptyCreative = () => {
    const creative: Creative = {
      id: generateId(),
      name: `Creative ${bulkCreatives.creatives.length + 1}`,
      format: 'Image',
      label: 'Static',
    }

    addCreative(creative)
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
      <div className={ds.cn('flex', ds.spacing.gap.sm)}>
        {/* Upload Zone - Compact */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={ds.cn(
            'flex-1 rounded-lg border-2 border-dashed text-center cursor-pointer transition-all',
            ds.spacing.padding.md,
            dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50'
          )}
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className={ds.cn(ds.typography.caption, 'font-medium text-foreground')}>Drop files or click to upload</p>
          <p className={ds.cn(ds.typography.caption, 'text-muted-foreground mt-0.5')}>Support: -Feed / -Story suffixes</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Browse Library Buttons */}
        <Button
          onClick={() => {
            setMediaLibraryType('video')
            setShowMediaLibrary(true)
          }}
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
          onClick={() => {
            setMediaLibraryType('image')
            setShowMediaLibrary(true)
          }}
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
          onClick={handleAddEmptyCreative}
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

      {/* Creatives Grid */}
      {bulkCreatives.creatives.length > 0 && (
        <div className={ds.spacing.vertical.sm}>
          <h4 className={ds.cn(ds.typography.cardTitle, 'text-foreground')}>Creatives ({bulkCreatives.creatives.length})</h4>

          <div className={ds.spacing.vertical.xs}>
            {bulkCreatives.creatives.map((creative) => (
              <div key={creative.id} className={ds.cn('rounded-lg border border-border bg-card', ds.spacing.padding.sm)}>
                <div className={ds.cn('flex items-center', ds.spacing.gap.sm)}>
                  {/* Creative Name */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={creative.name}
                      onChange={(e) => updateCreative(creative.id, { name: e.target.value })}
                      className={ds.cn(
                        'w-full px-2 py-1 font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded',
                        ds.typography.caption
                      )}
                    />
                  </div>

                  {/* Label Pills */}
                  <div className={ds.cn('flex', ds.spacing.gap.xs)}>
                    <Button
                      onClick={() => updateCreative(creative.id, { label: 'Static' })}
                      variant={creative.label === 'Static' ? 'default' : 'secondary'}
                      size="sm"
                      className={ds.cn(
                        ds.componentPresets.badge,
                        'font-medium transition-colors',
                        creative.label === 'Static' && ds.getBadgeColor('blue')
                      )}
                    >
                      Static
                    </Button>
                    <Button
                      onClick={() => updateCreative(creative.id, { label: 'Video' })}
                      variant={creative.label === 'Video' ? 'default' : 'secondary'}
                      size="sm"
                      className={ds.cn(
                        ds.componentPresets.badge,
                        'font-medium transition-colors',
                        creative.label === 'Video' && ds.getBadgeColor('green')
                      )}
                    >
                      Video
                    </Button>
                    <Button
                      onClick={() => updateCreative(creative.id, { label: 'UGC' })}
                      variant={creative.label === 'UGC' ? 'default' : 'secondary'}
                      size="sm"
                      className={ds.cn(
                        ds.componentPresets.badge,
                        'font-medium transition-colors',
                        creative.label === 'UGC' && ds.getBadgeColor('purple')
                      )}
                    >
                      UGC
                    </Button>
                    <Button
                      onClick={() => updateCreative(creative.id, { label: 'Other' })}
                      variant={creative.label === 'Other' ? 'default' : 'secondary'}
                      size="sm"
                      className={ds.cn(
                        ds.componentPresets.badge,
                        'font-medium transition-colors',
                        creative.label === 'Other' && ds.getBadgeColor('orange')
                      )}
                    >
                      Other
                    </Button>
                  </div>

                  {/* Feed Preview */}
                  <div className="relative group">
                    {creative.feedVersion ? (
                      <div className="w-12 h-12 rounded border border-border overflow-hidden bg-muted">
                        {creative.format === 'Video' ? (
                          creative.feedVersion.thumbnail?.startsWith('http') ? (
                            <img src={creative.feedVersion.thumbnail} className="w-full h-full object-cover" alt="Feed" />
                          ) : (
                            <video src={creative.feedVersion.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                          )
                        ) : (
                          <img src={creative.feedVersion.thumbnail || creative.feedVersion.url} alt="Feed" className="w-full h-full object-cover" />
                        )}
                        <Button
                          onClick={() => updateCreative(creative.id, { feedVersion: undefined })}
                          variant="ghost"
                          size="sm"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-auto p-0"
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Button
                          onClick={() => setOpenDropdown(openDropdown === `${creative.id}-feed` ? null : `${creative.id}-feed`)}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                          variant="outline"
                          className="w-12 h-12 rounded border-2 border-dashed cursor-pointer flex flex-col items-center justify-center p-1"
                        >
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={ds.cn(ds.typography.caption, 'text-muted-foreground')}>Feed</span>
                        </Button>
                        {openDropdown === `${creative.id}-feed` && (
                          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                            <Button
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*,video/*'
                                input.onchange = (e: any) => {
                                  const file = e.target?.files?.[0]
                                  if (file) {
                                    handleAssignFile(creative.id, 'feed', file)
                                    setOpenDropdown(null)
                                  }
                                }
                                input.click()
                              }}
                              variant="ghost"
                              className={ds.cn('w-full text-left px-3 py-2 cursor-pointer rounded-t-lg justify-start', ds.typography.caption)}
                            >
                              Computer
                            </Button>
                            <Button
                              onClick={() => {
                                setTargetCreativeId(creative.id)
                                setTargetSlot('feed')
                                // If the creative already has a format (from the other slot), use that type
                                // Otherwise default to 'image'
                                const existingFormat = creative.storyVersion ? creative.format : 'Image'
                                setMediaLibraryType(existingFormat === 'Video' ? 'video' : 'image')
                                setShowMediaLibrary(true)
                                setOpenDropdown(null)
                              }}
                              variant="ghost"
                              className={ds.cn('w-full text-left px-3 py-2 rounded-b-lg justify-start', ds.typography.caption)}
                            >
                              Library
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Story Preview */}
                  <div className="relative group">
                    {creative.storyVersion ? (
                      <div className="w-7 h-12 rounded border border-border overflow-hidden bg-muted">
                        {creative.format === 'Video' ? (
                          creative.storyVersion.thumbnail?.startsWith('http') ? (
                            <img src={creative.storyVersion.thumbnail} className="w-full h-full object-cover" alt="Story" />
                          ) : (
                            <video src={creative.storyVersion.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                          )
                        ) : (
                          <img src={creative.storyVersion.thumbnail || creative.storyVersion.url} alt="Story" className="w-full h-full object-cover" />
                        )}
                        <Button
                          onClick={() => updateCreative(creative.id, { storyVersion: undefined })}
                          variant="ghost"
                          size="sm"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-auto p-0"
                        >
                          <X className="h-2.5 w-2.5 text-white" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Button
                          onClick={() => setOpenDropdown(openDropdown === `${creative.id}-story` ? null : `${creative.id}-story`)}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                          variant="outline"
                          className="w-7 h-12 rounded border-2 border-dashed cursor-pointer flex flex-col items-center justify-center p-1"
                        >
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={ds.cn(ds.typography.caption, 'text-muted-foreground')}>Story</span>
                        </Button>
                        {openDropdown === `${creative.id}-story` && (
                          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                            <Button
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*,video/*'
                                input.onchange = (e: any) => {
                                  const file = e.target?.files?.[0]
                                  if (file) {
                                    handleAssignFile(creative.id, 'story', file)
                                    setOpenDropdown(null)
                                  }
                                }
                                input.click()
                              }}
                              variant="ghost"
                              className={ds.cn('w-full text-left px-3 py-2 cursor-pointer rounded-t-lg justify-start', ds.typography.caption)}
                            >
                              Computer
                            </Button>
                            <Button
                              onClick={() => {
                                setTargetCreativeId(creative.id)
                                setTargetSlot('story')
                                // If the creative already has a format (from the other slot), use that type
                                // Otherwise default to 'image'
                                const existingFormat = creative.feedVersion ? creative.format : 'Image'
                                setMediaLibraryType(existingFormat === 'Video' ? 'video' : 'image')
                                setShowMediaLibrary(true)
                                setOpenDropdown(null)
                              }}
                              variant="ghost"
                              className={ds.cn('w-full text-left px-3 py-2 rounded-b-lg justify-start', ds.typography.caption)}
                            >
                              Library
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle Copy Fields */}
                  <Button
                    onClick={() => setExpandedCreativeId(expandedCreativeId === creative.id ? null : creative.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors h-auto"
                    title="Edit copy for this creative"
                  >
                    <ChevronDown className={ds.cn('h-3.5 w-3.5 transition-transform', expandedCreativeId === creative.id && 'rotate-180')} />
                  </Button>

                  {/* Delete Creative */}
                  <Button
                    onClick={() => removeCreative(creative.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Expandable Copy Fields */}
                {expandedCreativeId === creative.id && (
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
                )}
              </div>
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
        open={showMediaLibrary}
        onClose={() => {
          setShowMediaLibrary(false)
          setTargetCreativeId(undefined)
          setTargetSlot(undefined)
        }}
        adAccountId={adAccountId || ''}
        type={mediaLibraryType}
        targetCreativeId={targetCreativeId}
        targetSlot={targetSlot}
        onAssign={handleAssignFromLibrary}
      />
    </div>
  )
}
