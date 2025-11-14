import { useRef, useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { generateId } from '@launcher-ads/sdk'
import type { Creative, CreativeVersion, CreativeLabel } from '@launcher-ads/sdk'

/**
 * Custom hook for handling creative file uploads
 * Manages file selection, drag & drop, and file assignment to creatives
 */
export function useCreativeFileUpload() {
  const { bulkCreatives, addCreative, updateCreative } = useBulkLauncher()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  /**
   * Handle file selection from input or drag & drop
   * Groups files by base name (without feed/story suffix) and creates creatives
   */
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

  /**
   * Handle drag & drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  /**
   * Assign a file to a specific creative's feed or story slot
   */
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

  return {
    fileInputRef,
    dragOver,
    setDragOver,
    handleFileSelect,
    handleDrop,
    handleAssignFile,
  }
}
