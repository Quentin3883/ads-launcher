import { useBulkLauncher } from '../store/bulk-launcher'
import type { ProgressStep } from '../store/bulk-launcher'
import { trpc } from '../trpc'
import { CAMPAIGN_TYPE_TO_OBJECTIVE } from '@launcher-ads/sdk'
import type { GeneratedAdSet } from '@launcher-ads/sdk'

interface LaunchCampaignParams {
  userId: string
  facebookPageId: string
  facebookPixelId?: string
  instagramAccountId?: string
  generatedAdSets: GeneratedAdSet[]
}

/**
 * Hook to launch campaigns to Facebook using tRPC
 */
export function useLaunchCampaign() {
  const mutation = trpc.facebookCampaigns.launchBulkCampaign.useMutation()

  const uploadVideo = async (adAccountId: string, videoData: string): Promise<string> => {
    const response = await fetch(`http://localhost:4000/facebook/media/upload-video/${adAccountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoData }),
    })
    if (!response.ok) {
      throw new Error('Failed to upload video')
    }
    const data = await response.json()
    return data.videoId
  }

  const uploadImage = async (adAccountId: string, imageData: string): Promise<string> => {
    const response = await fetch(`http://localhost:4000/facebook/media/upload-image/${adAccountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData }),
    })
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    const data = await response.json()
    return data.imageHash
  }

  const launchCampaign = async (params: LaunchCampaignParams) => {
    const store = useBulkLauncher.getState()
    const { campaign, adAccountId, setProgressSteps, updateProgressStep, setShowProgress } = store

    if (!adAccountId) {
      throw new Error('No ad account selected')
    }

    // Initialize progress steps
    const initialSteps: ProgressStep[] = [
      { id: 'prepare', label: 'Preparing campaign data', status: 'pending' },
      { id: 'upload', label: 'Uploading media assets', status: 'pending' },
      { id: 'create', label: 'Creating campaign structure', status: 'pending' },
      { id: 'adsets', label: 'Creating ad sets', status: 'pending' },
      { id: 'ads', label: 'Creating ads', status: 'pending' },
      { id: 'complete', label: 'Finalizing campaign', status: 'pending' },
    ]
    setProgressSteps(initialSteps)
    setShowProgress(true)

    try {
      // Step 1: Prepare
      updateProgressStep('prepare', { status: 'in_progress' })

      // Step 2: Pre-upload all videos and images to Facebook using REST API
      // Use a cache to avoid uploading the same file multiple times
      updateProgressStep('prepare', { status: 'completed' })
      updateProgressStep('upload', { status: 'in_progress' })
      console.log('📤 Pre-uploading media assets...')

    const videoCache = new Map<string, Promise<string>>()
    const imageCache = new Map<string, Promise<string>>()

    const videoUploadPromises: Promise<{ adSetIndex: number; adIndex: number; field: 'feed' | 'story'; videoId: string }>[] = []
    const imageUploadPromises: Promise<{ adSetIndex: number; adIndex: number; field: 'feed' | 'story'; imageHash: string }>[] = []

    params.generatedAdSets.forEach((adSet, adSetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        if (ad.format === 'Video') {
          // Upload Feed video if it's a data URL
          if (ad.creativeUrl.startsWith('data:video')) {
            // Check cache to avoid duplicate uploads
            if (!videoCache.has(ad.creativeUrl)) {
              videoCache.set(ad.creativeUrl, uploadVideo(adAccountId, ad.creativeUrl))
            }
            videoUploadPromises.push(
              videoCache.get(ad.creativeUrl)!.then((videoId) => ({
                adSetIndex,
                adIndex,
                field: 'feed' as const,
                videoId,
              }))
            )
          }

          // Upload Story video if it's a data URL
          if (ad.creativeUrlStory?.startsWith('data:video')) {
            // Check cache to avoid duplicate uploads
            if (!videoCache.has(ad.creativeUrlStory)) {
              videoCache.set(ad.creativeUrlStory, uploadVideo(adAccountId, ad.creativeUrlStory))
            }
            videoUploadPromises.push(
              videoCache.get(ad.creativeUrlStory)!.then((videoId) => ({
                adSetIndex,
                adIndex,
                field: 'story' as const,
                videoId,
              }))
            )
          }
        } else if (ad.format === 'Image') {
          // Upload Feed image if it's a data URL
          if (ad.creativeUrl.startsWith('data:image')) {
            // Check cache to avoid duplicate uploads
            if (!imageCache.has(ad.creativeUrl)) {
              imageCache.set(ad.creativeUrl, uploadImage(adAccountId, ad.creativeUrl))
            }
            imageUploadPromises.push(
              imageCache.get(ad.creativeUrl)!.then((imageHash) => ({
                adSetIndex,
                adIndex,
                field: 'feed' as const,
                imageHash,
              }))
            )
          }

          // Upload Story image if it's a data URL
          if (ad.creativeUrlStory?.startsWith('data:image')) {
            // Check cache to avoid duplicate uploads
            if (!imageCache.has(ad.creativeUrlStory)) {
              imageCache.set(ad.creativeUrlStory, uploadImage(adAccountId, ad.creativeUrlStory))
            }
            imageUploadPromises.push(
              imageCache.get(ad.creativeUrlStory)!.then((imageHash) => ({
                adSetIndex,
                adIndex,
                field: 'story' as const,
                imageHash,
              }))
            )
          }
        }
      })
    })

    // Wait for all uploads to complete
    const [uploadedVideos, uploadedImages] = await Promise.all([
      Promise.all(videoUploadPromises),
      Promise.all(imageUploadPromises),
    ])
    console.log(`✅ Uploaded ${videoCache.size} unique videos and ${imageCache.size} unique images (${uploadedVideos.length} video refs, ${uploadedImages.length} image refs)`)
    updateProgressStep('upload', {
      status: 'completed',
      detail: `Uploaded ${videoCache.size + imageCache.size} media assets`
    })

    // Step 3: Replace media data URLs with Facebook hashes/IDs
    updateProgressStep('create', { status: 'in_progress' })
    const processedAdSets = params.generatedAdSets.map((adSet, adSetIndex) => ({
      ...adSet,
      ads: adSet.ads.map((ad, adIndex) => {
        let creativeUrl = ad.creativeUrl
        let creativeUrlStory = ad.creativeUrlStory

        if (ad.format === 'Video') {
          // Replace Feed video data URL with Facebook video ID URL
          const feedVideo = uploadedVideos.find(
            (v) => v.adSetIndex === adSetIndex && v.adIndex === adIndex && v.field === 'feed'
          )
          if (feedVideo) {
            creativeUrl = `https://facebook.com/video/${feedVideo.videoId}`
          }

          // Replace Story video data URL with Facebook video ID URL
          const storyVideo = uploadedVideos.find(
            (v) => v.adSetIndex === adSetIndex && v.adIndex === adIndex && v.field === 'story'
          )
          if (storyVideo) {
            creativeUrlStory = `https://facebook.com/video/${storyVideo.videoId}`
          }
        } else if (ad.format === 'Image') {
          // Replace Feed image data URL with Facebook image hash URL
          const feedImage = uploadedImages.find(
            (i) => i.adSetIndex === adSetIndex && i.adIndex === adIndex && i.field === 'feed'
          )
          if (feedImage) {
            creativeUrl = `https://facebook.com/image/${feedImage.imageHash}`
          }

          // Replace Story image data URL with Facebook image hash URL
          const storyImage = uploadedImages.find(
            (i) => i.adSetIndex === adSetIndex && i.adIndex === adIndex && i.field === 'story'
          )
          if (storyImage) {
            creativeUrlStory = `https://facebook.com/image/${storyImage.imageHash}`
          }
        }

        return {
          name: ad.name,
          format: ad.format,
          creativeUrl,
          creativeUrlStory,
          headline: ad.headline,
          primaryText: ad.primaryText,
          cta: ad.cta,
          destination: ad.destination,
        }
      }),
    }))

    // Step 4: Transform data for API with video IDs instead of base64
    updateProgressStep('create', { status: 'completed' })
    updateProgressStep('adsets', { status: 'in_progress' })

    const launchData = {
      userId: params.userId,
      adAccountId: adAccountId,
      facebookPageId: params.facebookPageId,
      facebookPixelId: params.facebookPixelId,
      instagramAccountId: params.instagramAccountId,
      campaign: {
        name: campaign.name || 'Untitled Campaign',
        type: campaign.type || 'Traffic',
        objective: CAMPAIGN_TYPE_TO_OBJECTIVE[campaign.type || 'Traffic'] || 'OUTCOME_TRAFFIC',
        budgetMode: campaign.budgetMode || 'CBO',
        budgetType: campaign.budgetType || 'daily',
        budget: campaign.budget,
        startDate: campaign.startDate || new Date().toISOString(),
        endDate: campaign.endDate,
      },
      adSets: processedAdSets.map((adSet) => ({
        name: adSet.name,
        audience: {
          type: adSet.audience.type,
          name: adSet.audience.name,
          interests: adSet.audience.interests,
          customAudienceId: adSet.audience.customAudienceId,
        },
        placements: adSet.placements,
        geoLocations: adSet.geoLocations,
        demographics: adSet.demographics,
        optimizationEvent: adSet.optimizationEvent,
        budget: adSet.budget,
        budgetType: adSet.budgetType,
        ads: adSet.ads,
      })),
    }

      // Step 5: Use tRPC mutation to create campaign
      updateProgressStep('adsets', { status: 'completed' })
      updateProgressStep('ads', { status: 'in_progress' })

      const result = await mutation.mutateAsync(launchData)

      // Step 6: Complete
      updateProgressStep('ads', { status: 'completed' })
      updateProgressStep('complete', {
        status: 'completed',
        detail: 'Campaign created successfully'
      })

      return result
    } catch (error: any) {
      // Update progress with error
      const currentSteps = useBulkLauncher.getState().progressSteps
      const inProgressStep = currentSteps.find(s => s.status === 'in_progress')
      if (inProgressStep) {
        updateProgressStep(inProgressStep.id, {
          status: 'error',
          error: error.message || 'An error occurred'
        })
      }
      throw error
    }
  }

  return {
    launchCampaign,
    isLaunching: mutation.isPending,
    error: mutation.error?.message || null,
    reset: () => mutation.reset(),
  }
}
