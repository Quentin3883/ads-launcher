'use client'

import { useState, useRef } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { CTA_OPTIONS, generateId, hasDynamicParams, getPreviewText } from '@launcher-ads/sdk'
import type { Creative, CreativeVersion, CreativeLabel } from '@launcher-ads/sdk'
import { Upload, Trash2, Plus, X, Monitor, Smartphone, Lock, Library, ChevronDown, Sparkles } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { FormSelect } from '@/components/ui/form-select'
import { SectionCard } from '@/components/ui/section-card'
import { MediaLibraryModal } from '../media-library-modal'

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
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Creatives & Copies</h3>
          <p className="text-xs text-muted-foreground">Upload files • Auto-groups: "BR - SMS - Feed.png" + "BR - SMS - Story.png"</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
          <div className="text-[10px] text-muted-foreground">Creatives</div>
          <div className="text-xl font-bold text-primary">{bulkCreatives.creatives.length}</div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex gap-2">
        {/* Upload Zone - Compact */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50'
          }`}
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs font-medium text-foreground">Drop files or click to upload</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Support: -Feed / -Story suffixes</p>
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
        <button
          onClick={() => {
            setMediaLibraryType('video')
            setShowMediaLibrary(true)
          }}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors min-w-[100px]"
        >
          <Library className="h-5 w-5" />
          <span className="text-xs">Videos</span>
        </button>
        <button
          onClick={() => {
            setMediaLibraryType('image')
            setShowMediaLibrary(true)
          }}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors min-w-[100px]"
        >
          <Library className="h-5 w-5" />
          <span className="text-xs">Images</span>
        </button>

        {/* Add Empty Creative */}
        <button
          onClick={handleAddEmptyCreative}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors min-w-[100px]"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">New</span>
        </button>
      </div>

      {/* Creatives Grid */}
      {bulkCreatives.creatives.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Creatives ({bulkCreatives.creatives.length})</h4>

          <div className="space-y-1.5">
            {bulkCreatives.creatives.map((creative) => (
              <div key={creative.id} className="p-2 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2">
                  {/* Creative Name */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={creative.name}
                      onChange={(e) => updateCreative(creative.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                    />
                  </div>

                  {/* Label Pills */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateCreative(creative.id, { label: 'Static' })}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${
                        creative.label === 'Static'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Static
                    </button>
                    <button
                      onClick={() => updateCreative(creative.id, { label: 'Video' })}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${
                        creative.label === 'Video'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Video
                    </button>
                    <button
                      onClick={() => updateCreative(creative.id, { label: 'UGC' })}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${
                        creative.label === 'UGC'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      UGC
                    </button>
                    <button
                      onClick={() => updateCreative(creative.id, { label: 'Other' })}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${
                        creative.label === 'Other'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Other
                    </button>
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
                        <button
                          onClick={() => updateCreative(creative.id, { feedVersion: undefined })}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === `${creative.id}-feed` ? null : `${creative.id}-feed`)}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                          className="w-12 h-12 rounded border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 cursor-pointer flex flex-col items-center justify-center"
                        >
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground">Feed</span>
                        </button>
                        {openDropdown === `${creative.id}-feed` && (
                          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
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
                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted cursor-pointer rounded-t-lg"
                            >
                              Computer
                            </button>
                            <button
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
                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-b-lg"
                            >
                              Library
                            </button>
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
                        <button
                          onClick={() => updateCreative(creative.id, { storyVersion: undefined })}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === `${creative.id}-story` ? null : `${creative.id}-story`)}
                          onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                          className="w-7 h-12 rounded border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 cursor-pointer flex flex-col items-center justify-center"
                        >
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground">Story</span>
                        </button>
                        {openDropdown === `${creative.id}-story` && (
                          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
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
                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted cursor-pointer rounded-t-lg"
                            >
                              Computer
                            </button>
                            <button
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
                              className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-b-lg"
                            >
                              Library
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle Copy Fields */}
                  <button
                    onClick={() => setExpandedCreativeId(expandedCreativeId === creative.id ? null : creative.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit copy for this creative"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedCreativeId === creative.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Delete Creative */}
                  <button
                    onClick={() => removeCreative(creative.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expandable Copy Fields */}
                {expandedCreativeId === creative.id && (
                  <div className="mt-2 pt-2 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground mb-1.5">
                      <span>Optional Copy (overrides copy variants)</span>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Sparkles className="h-3 w-3" />
                        <span>Supports {'{{city}}'}, {'{{label}}'}, {'{{country}}'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FormField
                          label="Headline"
                          maxLength={255}
                          value={creative.headline || ''}
                          onChange={(val) => updateCreative(creative.id, { headline: val || undefined })}
                          placeholder="Optional headline..."
                          className="text-xs"
                        />
                        {creative.headline && hasDynamicParams(creative.headline) && (
                          <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                            <p className="text-[9px] text-blue-600 font-medium">Preview:</p>
                            <p className="text-[10px] text-blue-700">{getPreviewText(creative.headline)}</p>
                          </div>
                        )}
                      </div>
                      <FormSelect
                        label="CTA"
                        value={creative.cta || ''}
                        onChange={(val) => updateCreative(creative.id, { cta: val || undefined })}
                        options={[
                          { value: '', label: '(Use copy variant)' },
                          ...CTA_OPTIONS.map((cta) => ({ value: cta.value, label: cta.label }))
                        ]}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <FormField
                        label="Primary Text"
                        maxLength={2000}
                        value={creative.primaryText || ''}
                        onChange={(val) => updateCreative(creative.id, { primaryText: val || undefined })}
                        placeholder="Optional primary text..."
                        multiline
                        rows={2}
                        className="text-xs"
                      />
                      {creative.primaryText && hasDynamicParams(creative.primaryText) && (
                        <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                          <p className="text-[9px] text-blue-600 font-medium">Preview:</p>
                          <p className="text-[10px] text-blue-700">{getPreviewText(creative.primaryText)}</p>
                        </div>
                      )}
                    </div>
                    <FormField
                      label="Description"
                      maxLength={255}
                      value={creative.description || ''}
                      onChange={(val) => updateCreative(creative.id, { description: val || undefined })}
                      placeholder="Optional description..."
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy Section */}
      <SectionCard
        title="Ad Copy"
        subtitle={
          <span className="flex items-center gap-1 text-blue-600">
            <Sparkles className="h-3 w-3" />
            <span className="text-xs">Supports {'{{city}}'}, {'{{label}}'}, {'{{country}}'}</span>
          </span>
        }
        headerAction={
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkCreatives.sameCopyForAll}
              onChange={(e) => updateBulkCreatives({ sameCopyForAll: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-xs text-foreground">Same for all</span>
          </label>
        }
        className="p-3"
      >
        {bulkCreatives.sameCopyForAll ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FormField
                  label="Headline"
                  maxLength={40}
                  value={bulkCreatives.globalHeadline || ''}
                  onChange={(val) => updateBulkCreatives({ globalHeadline: val })}
                  placeholder="Your headline"
                />
                {bulkCreatives.globalHeadline && hasDynamicParams(bulkCreatives.globalHeadline) && (
                  <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                    <p className="text-[9px] text-blue-600 font-medium">Preview:</p>
                    <p className="text-[10px] text-blue-700">{getPreviewText(bulkCreatives.globalHeadline)}</p>
                  </div>
                )}
              </div>
              <div>
                <FormField
                  label="Primary Text"
                  maxLength={125}
                  value={bulkCreatives.globalPrimaryText || ''}
                  onChange={(val) => updateBulkCreatives({ globalPrimaryText: val })}
                  placeholder="Your message"
                />
                {bulkCreatives.globalPrimaryText && hasDynamicParams(bulkCreatives.globalPrimaryText) && (
                  <div className="mt-1 px-2 py-1 rounded bg-blue-50 border border-blue-200">
                    <p className="text-[9px] text-blue-600 font-medium">Preview:</p>
                    <p className="text-[10px] text-blue-700">{getPreviewText(bulkCreatives.globalPrimaryText)}</p>
                  </div>
                )}
              </div>
              <FormSelect
                label="CTA"
                value={bulkCreatives.globalCTA || 'Learn More'}
                onChange={(val) => updateBulkCreatives({ globalCTA: val })}
                options={CTA_OPTIONS}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Individual copy editing per creative coming soon...</p>
        )}
      </SectionCard>

      {/* Copy Variants */}
      <SectionCard
        title="Copy Variants (A/B Test)"
        subtitle="Multiply ads for testing"
        headerAction={
          <div className="flex items-center gap-3">
            {bulkCreatives.sameCopyForAll && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                <Lock className="h-3 w-3" />
                <span>Locked by "Same for all"</span>
              </div>
            )}
            <label className={`flex items-center gap-2 ${bulkCreatives.sameCopyForAll ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={bulkCreatives.enableVariants}
                onChange={(e) => {
                  if (!bulkCreatives.sameCopyForAll) {
                    updateBulkCreatives({ enableVariants: e.target.checked })
                  }
                }}
                disabled={bulkCreatives.sameCopyForAll}
                className="rounded border-border disabled:cursor-not-allowed"
              />
              <span className="text-xs text-foreground">Enable</span>
            </label>
          </div>
        }
        className="p-3"
      >
        {bulkCreatives.sameCopyForAll ? (
          <div className="text-center py-6">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Copy variants are locked when "Same for all" is enabled</p>
            <p className="text-xs text-muted-foreground mt-1">Disable "Same for all" to create copy variants</p>
          </div>
        ) : bulkCreatives.enableVariants && (
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
      </SectionCard>

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
