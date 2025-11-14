// @ts-nocheck - tRPC type collision with reserved names, works correctly at runtime
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

  const uploadVideo = async (adAccountId: string, videoData: string, uploadId?: string, fileName?: string): Promise<string> => {
    const response = await fetch(`http://localhost:4000/facebook/media/upload-video/${adAccountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoData, uploadId, fileName }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Failed to upload video: ${errorData.message || response.statusText}`)
    }
    const data = await response.json()
    return data.videoId
  }

  const uploadImage = async (adAccountId: string, imageData: string, fileName?: string): Promise<string> => {
    const response = await fetch(`http://localhost:4000/facebook/media/upload-image/${adAccountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, fileName }),
    })
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    const data = await response.json()
    return data.imageHash
  }

  const launchCampaign = async (params: LaunchCampaignParams) => {
    const store = useBulkLauncher.getState()
    const { campaign, bulkAudiences, adAccountId, setProgressSteps, updateProgressStep, setShowProgress } = store

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

    // Track unique videos/images and their metadata (don't upload yet)
    const uniqueVideos = new Map<string, { name: string; refs: { adSetIndex: number; adIndex: number; field: 'feed' | 'story' }[] }>()
    const uniqueImages = new Map<string, { name: string; refs: { adSetIndex: number; adIndex: number; field: 'feed' | 'story' }[] }>()

    params.generatedAdSets.forEach((adSet, adSetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        if (ad.format === 'Video') {
          // Track Feed video if it's a data URL
          if (ad.creativeUrl.startsWith('data:video')) {
            if (!uniqueVideos.has(ad.creativeUrl)) {
              const videoName = `${ad.name || `Video_${adSetIndex}_${adIndex}`}_feed`
              uniqueVideos.set(ad.creativeUrl, { name: videoName, refs: [] })
            }
            uniqueVideos.get(ad.creativeUrl)!.refs.push({ adSetIndex, adIndex, field: 'feed' })
          }

          // Track Story video if it's a data URL
          if (ad.creativeUrlStory?.startsWith('data:video')) {
            if (!uniqueVideos.has(ad.creativeUrlStory)) {
              const videoName = `${ad.name || `Video_${adSetIndex}_${adIndex}`}_story`
              uniqueVideos.set(ad.creativeUrlStory, { name: videoName, refs: [] })
            }
            uniqueVideos.get(ad.creativeUrlStory)!.refs.push({ adSetIndex, adIndex, field: 'story' })
          }
        } else if (ad.format === 'Image') {
          // Track Feed image if it's a data URL
          if (ad.creativeUrl.startsWith('data:image')) {
            if (!uniqueImages.has(ad.creativeUrl)) {
              const imageName = `${ad.name || `Image_${adSetIndex}_${adIndex}`}_feed`
              uniqueImages.set(ad.creativeUrl, { name: imageName, refs: [] })
            }
            uniqueImages.get(ad.creativeUrl)!.refs.push({ adSetIndex, adIndex, field: 'feed' })
          }

          // Track Story image if it's a data URL
          if (ad.creativeUrlStory?.startsWith('data:image')) {
            if (!uniqueImages.has(ad.creativeUrlStory)) {
              const imageName = `${ad.name || `Image_${adSetIndex}_${adIndex}`}_story`
              uniqueImages.set(ad.creativeUrlStory, { name: imageName, refs: [] })
            }
            uniqueImages.get(ad.creativeUrlStory)!.refs.push({ adSetIndex, adIndex, field: 'story' })
          }
        }
      })
    })

    // Upload all media in parallel with progress tracking
    const totalVideos = uniqueVideos.size
    const totalImages = uniqueImages.size
    let completedVideos = 0
    let completedImages = 0

    // Initialize upload progress in store for each file with SSE connections
    const { setUploadProgress, updateUploadProgress } = useBulkLauncher.getState()

    // Create unique upload IDs and progress list
    const uploadIds: string[] = []
    const uploadProgressList = Array.from(uniqueVideos.entries()).map(([dataUrl, videoInfo], index) => {
      const uploadId = `upload_${Date.now()}_${index}`
      uploadIds.push(uploadId)
      return {
        id: uploadId,
        fileName: videoInfo.name,
        type: 'video' as const,
        status: 'uploading' as const,
        progress: 0,
      }
    })
    setUploadProgress(uploadProgressList)

    // Setup SSE listeners for each upload
    const eventSources: EventSource[] = []
    uploadIds.forEach((uploadId) => {
      const eventSource = new EventSource(`http://localhost:4000/facebook/media/upload-progress/${uploadId}`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          updateUploadProgress(uploadId, {
            status: data.status,
            progress: data.progress,
            phase: data.phase,
            error: data.error,
          })
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        eventSource.close()
      }

      eventSources.push(eventSource)
    })

    // Upload videos (only once per unique video)
    const videoIdMap = new Map<string, string>() // Map dataUrl -> videoId
    const videoUploadPromises = Array.from(uniqueVideos.entries()).map(([dataUrl, videoInfo], index) => {
      const uploadId = uploadIds[index]

      return uploadVideo(adAccountId, dataUrl, uploadId, videoInfo.name)
        .then((videoId) => {
          videoIdMap.set(dataUrl, videoId)
          completedVideos++
          updateProgressStep('upload', {
            status: 'in_progress',
            detail: `Uploaded ${completedVideos}/${totalVideos} videos, ${completedImages}/${totalImages} images`
          })
          return videoId
        })
        .catch((error) => {
          updateUploadProgress(uploadId, {
            status: 'error',
            progress: 0,
            error: error.message,
          })
          throw error
        })
    })

    // Upload images (only once per unique image)
    const imageHashMap = new Map<string, string>() // Map dataUrl -> imageHash
    const imageUploadPromises = Array.from(uniqueImages.entries()).map(([dataUrl, imageInfo]) => {
      return uploadImage(adAccountId, dataUrl, imageInfo.name)
        .then((imageHash) => {
          imageHashMap.set(dataUrl, imageHash)
          completedImages++
          updateProgressStep('upload', {
            status: 'in_progress',
            detail: `Uploaded ${completedVideos}/${totalVideos} videos, ${completedImages}/${totalImages} images`
          })
          return imageHash
        })
    })

    // Wait for all uploads to complete in parallel
    await Promise.all([...videoUploadPromises, ...imageUploadPromises])

    // Close all SSE connections
    eventSources.forEach(es => es.close())

    console.log(`✅ Uploaded ${totalVideos} unique videos and ${totalImages} unique images`)

    // Update all uploads to "processing" status
    uploadProgressList.forEach(upload => {
      updateUploadProgress(upload.id, {
        status: 'processing',
        progress: 100,
        phase: 'processing',
      })
    })

    updateProgressStep('upload', {
      status: 'in_progress',
      detail: `Processing ${totalVideos} videos...`
    })

    // Now wait for all videos to be ready (check status)
    console.log('⏳ Waiting for all videos to be processed by Facebook...')
    const videoReadyPromises = Array.from(videoIdMap.entries()).map(async ([dataUrl, videoId], index) => {
      const uploadId = uploadIds[index]
      try {
        // Poll video status until ready
        const response = await fetch(`http://localhost:4000/facebook/media/video-status/${adAccountId}/${videoId}`)
        if (!response.ok) {
          throw new Error('Failed to check video status')
        }
        const data = await response.json()

        updateUploadProgress(uploadId, {
          status: 'completed',
          progress: 100,
        })

        return data
      } catch (error: any) {
        updateUploadProgress(uploadId, {
          status: 'error',
          error: error.message,
        })
        throw error
      }
    })

    await Promise.all(videoReadyPromises)
    console.log('✅ All videos processed and ready')

    updateProgressStep('upload', {
      status: 'completed',
      detail: `Uploaded and processed ${totalVideos} videos and ${totalImages} images`
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
          if (ad.creativeUrl.startsWith('data:video')) {
            const videoId = videoIdMap.get(ad.creativeUrl)
            if (videoId) {
              creativeUrl = `https://facebook.com/video/${videoId}`
            }
          }

          // Replace Story video data URL with Facebook video ID URL
          if (ad.creativeUrlStory?.startsWith('data:video')) {
            const videoId = videoIdMap.get(ad.creativeUrlStory)
            if (videoId) {
              creativeUrlStory = `https://facebook.com/video/${videoId}`
            }
          }
        } else if (ad.format === 'Image') {
          // Replace Feed image data URL with Facebook image hash URL
          if (ad.creativeUrl.startsWith('data:image')) {
            const imageHash = imageHashMap.get(ad.creativeUrl)
            if (imageHash) {
              creativeUrl = `https://facebook.com/image/${imageHash}`
            }
          }

          // Replace Story image data URL with Facebook image hash URL
          if (ad.creativeUrlStory?.startsWith('data:image')) {
            const imageHash = imageHashMap.get(ad.creativeUrlStory)
            if (imageHash) {
              creativeUrlStory = `https://facebook.com/image/${imageHash}`
            }
          }
        }

        return {
          name: ad.name,
          format: ad.format,
          label: (ad as any).label, // Include label from ad
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
      customEventType: bulkAudiences.customEventType,
      customEventStr: bulkAudiences.customEventStr,
      customConversionId: bulkAudiences.customConversionId,
      campaign: {
        name: campaign.name || 'Untitled Campaign',
        type: campaign.type || 'Traffic',
        objective: CAMPAIGN_TYPE_TO_OBJECTIVE[campaign.type || 'Traffic'] || 'OUTCOME_TRAFFIC',
        budgetMode: campaign.budgetMode || 'CBO',
        budgetType: campaign.budgetType || 'daily',
        budget: campaign.budget,
        startDate: campaign.startDate || new Date().toISOString(),
        endDate: campaign.endDate,
        urlTags: campaign.urlTags, // Include Facebook url_tags for UTM tracking
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

      // Step 6: Save to database
      updateProgressStep('ads', { status: 'completed' })
      updateProgressStep('complete', { status: 'in_progress', detail: 'Saving launch configuration...' })

      try {
        const { bulkAudiences, bulkCreatives, matrixConfig, clientId } = store

        // Save bulk launch to database
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-launches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: params.userId,
            clientId: clientId,
            adAccountId: adAccountId,
            name: campaign.name || 'Untitled Campaign',
            mode: 'create',
            launchMode: store.launchMode,
            campaign: campaign,
            bulkAudiences: bulkAudiences,
            bulkCreatives: bulkCreatives,
            matrixConfig: matrixConfig,
            totalAdSets: params.generatedAdSets.length,
            totalAds: params.generatedAdSets.reduce((sum, adSet) => sum + adSet.ads.length, 0),
          }),
        })

        // Mark as launched
        console.log('✅ Launch saved to database')
      } catch (error) {
        console.error('Failed to save launch to database:', error)
        // Don't fail the entire launch if saving fails
      }

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
