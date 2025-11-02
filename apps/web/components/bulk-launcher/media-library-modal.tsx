'use client'

import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Video, Loader2, Monitor, Smartphone } from 'lucide-react'

interface MediaLibraryModalProps {
  open: boolean
  onClose: () => void
  adAccountId: string
  type: 'image' | 'video'
  targetCreativeId?: string
  targetSlot?: 'feed' | 'story'
  onAssign: (mediaUrl: string, thumbnailUrl: string | undefined, format: 'Feed' | 'Story' | 'Both', mediaType: 'image' | 'video') => void
}

export interface MediaItem {
  id?: string
  hash?: string
  url?: string
  permalink_url?: string
  thumbnailUrl?: string
  title?: string
  width?: number
  height?: number
  type: 'image' | 'video'
}

export function MediaLibraryModal({
  open,
  onClose,
  adAccountId,
  type,
  targetCreativeId,
  targetSlot,
  onAssign,
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && adAccountId) {
      fetchMedia()
    }
  }, [open, adAccountId, type])

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = type === 'image' ? 'images' : 'videos'
      const response = await fetch(
        `http://localhost:4000/facebook/media/library/${endpoint}/${adAccountId}?limit=50`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()
      const items = (type === 'image' ? data.images : data.videos).map((item: any) => ({
        ...item,
        type,
      }))
      setMedia(items)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMediaUrl = (item: MediaItem) => {
    if (item.type === 'image') {
      return `https://facebook.com/image/${item.hash}`
    } else {
      return `https://facebook.com/video/${item.id}`
    }
  }

  const handleAssign = (item: MediaItem, format: 'Feed' | 'Story' | 'Both') => {
    // For images from library, use special format: fb-image-hash:{hash}
    // For videos from library, use special format: fb-video-id:{id}
    // This tells the backend to use the existing hash/id instead of uploading
    const mediaUrl = item.type === 'image'
      ? `fb-image-hash:${item.hash}`
      : `fb-video-id:${item.id}`

    const thumbnailUrl = item.type === 'image'
      ? (item.permalink_url || item.url)
      : item.thumbnailUrl

    onAssign(mediaUrl, thumbnailUrl, format, item.type)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[85vh] bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            {type === 'image' ? (
              <ImageIcon className="h-5 w-5 text-primary" />
            ) : (
              <Video className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Select {type === 'image' ? 'Image' : 'Video'} from Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <button
                onClick={fetchMedia}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No {type === 'image' ? 'images' : 'videos'} found in your Media Library
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {media.map((item) => {
                const key = item.id || item.hash || ''

                return (
                  <div
                    key={key}
                    className="group relative rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-all"
                  >
                    {/* Media Preview */}
                    <div className="relative aspect-square bg-muted">
                      {type === 'image' ? (
                        <img
                          src={item.permalink_url || item.url}
                          alt={item.hash || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )
                      )}

                      {/* Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] text-white truncate">
                          {type === 'image'
                            ? `${item.width}×${item.height}`
                            : item.title || 'Untitled'}
                        </p>
                      </div>
                    </div>

                    {/* Format Selection Buttons */}
                    <div className="p-1.5 bg-card flex gap-1">
                      {targetCreativeId && targetSlot ? (
                        // If targeting a specific slot, show only that button
                        <button
                          onClick={() => handleAssign(item, targetSlot === 'feed' ? 'Feed' : 'Story')}
                          className="flex-1 px-1.5 py-1 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Select
                        </button>
                      ) : (
                        // Otherwise show all three options
                        <>
                          <button
                            onClick={() => handleAssign(item, 'Feed')}
                            className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Add as Feed"
                          >
                            <Monitor className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleAssign(item, 'Story')}
                            className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Add as Story"
                          >
                            <Smartphone className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleAssign(item, 'Both')}
                            className="flex-1 px-1.5 py-1 rounded text-[10px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Add as Both"
                          >
                            Both
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {media.length} {type === 'image' ? 'images' : 'videos'} • Click Feed, Story, or Both to add
          </p>
        </div>
      </div>
    </div>
  )
}
