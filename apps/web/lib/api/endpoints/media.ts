import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Schemas
const UploadVideoResponseSchema = z.object({
  videoId: z.string(),
})

const UploadImageResponseSchema = z.object({
  imageHash: z.string(),
})

const VideoStatusResponseSchema = z.object({
  status: z.string(),
  videoId: z.string(),
})

const MediaItemSchema = z.object({
  id: z.string(),
  url: z.string().optional(),
  thumbnail: z.string().optional(),
  name: z.string().optional(),
  createdTime: z.string().optional(),
})

export type MediaItem = z.infer<typeof MediaItemSchema>

/**
 * Media API - handles video/image uploads and Facebook media library
 */
export const mediaAPI = {
  /**
   * Upload video to Facebook
   */
  uploadVideo: async (
    adAccountId: string,
    videoData: string,
    uploadId?: string,
    fileName?: string
  ): Promise<string> => {
    const response = await fetch(
      `${API_URL}/facebook/media/upload-video/${adAccountId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoData, uploadId, fileName }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Failed to upload video: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    const validated = UploadVideoResponseSchema.parse(data)
    return validated.videoId
  },

  /**
   * Upload image to Facebook
   */
  uploadImage: async (
    adAccountId: string,
    imageData: string,
    fileName?: string
  ): Promise<string> => {
    const response = await fetch(
      `${API_URL}/facebook/media/upload-image/${adAccountId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, fileName }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await response.json()
    const validated = UploadImageResponseSchema.parse(data)
    return validated.imageHash
  },

  /**
   * Check video processing status
   */
  checkVideoStatus: async (
    adAccountId: string,
    videoId: string
  ): Promise<{ status: string; videoId: string }> => {
    const response = await fetch(
      `${API_URL}/facebook/media/video-status/${adAccountId}/${videoId}`
    )

    if (!response.ok) {
      throw new Error('Failed to check video status')
    }

    const data = await response.json()
    return VideoStatusResponseSchema.parse(data)
  },

  /**
   * Fetch media library (images or videos)
   */
  fetchMediaLibrary: async (
    adAccountId: string,
    type: 'image' | 'video',
    limit: number = 50
  ): Promise<MediaItem[]> => {
    const endpoint = type === 'image' ? 'images' : 'videos'
    const response = await fetch(
      `${API_URL}/facebook/media/library/${endpoint}/${adAccountId}?limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch media')
    }

    const data = await response.json()
    return z.array(MediaItemSchema).parse(data)
  },
}
