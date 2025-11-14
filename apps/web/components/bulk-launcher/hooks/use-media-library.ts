import { useState } from 'react'
import { useBulkLauncher } from '@/lib/store/bulk-launcher'
import { generateId } from '@launcher-ads/sdk'
import type { Creative, CreativeVersion } from '@launcher-ads/sdk'

/**
 * Custom hook for managing media library modal state and interactions
 */
export function useMediaLibrary() {
  const { bulkCreatives, addCreative, updateCreative } = useBulkLauncher()
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [mediaLibraryType, setMediaLibraryType] = useState<'image' | 'video'>('video')
  const [targetCreativeId, setTargetCreativeId] = useState<string | undefined>()
  const [targetSlot, setTargetSlot] = useState<'feed' | 'story' | undefined>()

  /**
   * Open media library modal
   */
  const openMediaLibrary = (
    type: 'image' | 'video',
    creativeId?: string,
    slot?: 'feed' | 'story'
  ) => {
    setMediaLibraryType(type)
    setTargetCreativeId(creativeId)
    setTargetSlot(slot)
    setShowMediaLibrary(true)
  }

  /**
   * Close media library modal and reset targeting
   */
  const closeMediaLibrary = () => {
    setShowMediaLibrary(false)
    setTargetCreativeId(undefined)
    setTargetSlot(undefined)
  }

  /**
   * Handle media assignment from library
   * Either updates existing creative or creates a new one
   */
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
    closeMediaLibrary()
  }

  return {
    showMediaLibrary,
    mediaLibraryType,
    targetCreativeId,
    targetSlot,
    openMediaLibrary,
    closeMediaLibrary,
    handleAssignFromLibrary,
  }
}
