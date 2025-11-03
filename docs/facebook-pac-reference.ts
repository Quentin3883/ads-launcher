/**
 * Meta Marketing API - Placement Asset Customization (PAC) Reference
 * Graph API v24.0 - facebook-nodejs-business-sdk
 *
 * Creates a single Ad that serves different assets to Feed vs Story placements
 * - Feed: Image (1:1 or 4:5)
 * - Story: Video (9:16)
 */

import bizSdk from 'facebook-nodejs-business-sdk'
import fs from 'fs'
import path from 'path'

const { AdAccount, AdImage, AdVideo, AdSet, AdCreative, Ad, Campaign } = bizSdk

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  accessToken: string
  adAccountId: string // Format: act_123456789
  pageId: string
  campaignId?: string
}

// Initialize SDK
function initSdk(accessToken: string) {
  bizSdk.FacebookAdsApi.init(accessToken, undefined, { version: 'v24.0' })
}

// ============================================================================
// 1. Upload Image (for Feed placement)
// ============================================================================

async function uploadImage(
  adAccountId: string,
  filePath: string
): Promise<{ image_hash: string }> {
  console.log(`📤 Uploading image: ${filePath}`)

  const adAccount = new AdAccount(adAccountId)
  const image = new AdImage(null, adAccountId)

  image.setParams({
    filename: path.basename(filePath),
    bytes: fs.readFileSync(filePath),
  })

  const response = await image.create(['hash'])
  const imageHash = response.hash

  console.log(`✅ Image uploaded: ${imageHash}`)
  return { image_hash: imageHash }
}

// ============================================================================
// 2. Upload Video (for Story placement)
// ============================================================================

async function uploadVideo(
  adAccountId: string,
  filePath: string
): Promise<{ video_id: string }> {
  console.log(`📤 Uploading video: ${filePath}`)

  const adAccount = new AdAccount(adAccountId)
  const video = new AdVideo(null, adAccountId)

  video.setParams({
    name: path.basename(filePath),
    source: fs.createReadStream(filePath),
  })

  const response = await video.create(['id'])
  const videoId = response.id

  console.log(`⏳ Video uploaded, polling for processing... ID: ${videoId}`)

  // Poll video status until ready
  await pollVideoStatus(adAccountId, videoId)

  console.log(`✅ Video ready: ${videoId}`)
  return { video_id: videoId }
}

async function pollVideoStatus(
  adAccountId: string,
  videoId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const video = new AdVideo(videoId)
    const status = await video.get(['status'])

    console.log(`  Video status: ${JSON.stringify(status.status)}`)

    if (status.status?.video_status === 'ready') {
      return
    }

    if (status.status?.video_status === 'error') {
      throw new Error(`Video processing failed: ${JSON.stringify(status.status)}`)
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Video processing timeout')
}

// ============================================================================
// 3. Create AdSet with Feed + Story placements
// ============================================================================

async function createAdSet(
  adAccountId: string,
  campaignId: string,
  pageId: string
): Promise<string> {
  console.log(`📦 Creating AdSet...`)

  const adAccount = new AdAccount(adAccountId)
  const adSet = new AdSet(null, adAccountId)

  adSet.setParams({
    name: 'Feed + Story AdSet - PAC',
    campaign_id: campaignId,
    status: 'PAUSED',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    daily_budget: 5000, // $50.00
    targeting: {
      geo_locations: { countries: ['US'] },
      age_min: 18,
      age_max: 65,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed'],
      instagram_positions: ['story'],
    },
    promoted_object: {
      page_id: pageId,
    },
  })

  const response = await adSet.create(['id', 'name'])
  const adSetId = response.id

  console.log(`✅ AdSet created: ${adSetId}`)
  return adSetId
}

// ============================================================================
// 4. Create PAC Creative with asset_feed_spec
// ============================================================================

async function createPacCreative(
  adAccountId: string,
  pageId: string,
  imageHash: string,
  videoId: string,
  websiteUrl: string
): Promise<string> {
  console.log(`🎨 Creating PAC Creative...`)

  const adAccount = new AdAccount(adAccountId)
  const creative = new AdCreative(null, adAccountId)

  creative.setParams({
    name: 'PAC Creative - Feed Image + Story Video',
    asset_feed_spec: {
      // Assets avec labels
      images: [
        {
          hash: imageHash,
          adlabels: [{ name: 'LBL_FEED_IMG' }],
        },
      ],
      videos: [
        {
          video_id: videoId,
          adlabels: [{ name: 'LBL_STORY_VIDEO' }],
        },
      ],

      // Textes communs
      titles: [
        {
          text: 'Détectez les voleurs instantanément',
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      bodies: [
        {
          text: 'Alertes IA en temps réel — essayez la démo',
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      link_urls: [
        {
          website_url: websiteUrl,
          display_url: new URL(websiteUrl).hostname,
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],

      // Call to action
      call_to_action_types: ['LEARN_MORE'],

      // Format automatique avec optimization par placement
      ad_formats: ['AUTOMATIC_FORMAT'],
      optimization_type: 'PLACEMENT',

      // CRITICAL: Asset customization rules pour router les assets
      asset_customization_rules: [
        // Rule 1: Facebook Feed → Image
        {
          customization_spec: {
            publisher_platforms: ['facebook'],
            facebook_positions: ['feed'],
          },
          image_label: { name: 'LBL_FEED_IMG' },
          title_label: { name: 'LBL_COMMON' },
          body_label: { name: 'LBL_COMMON' },
          link_url_label: { name: 'LBL_COMMON' },
          call_to_action_label: { name: 'LBL_COMMON' },
          priority: 1,
        },
        // Rule 2: Instagram Story → Video
        {
          customization_spec: {
            publisher_platforms: ['instagram'],
            instagram_positions: ['story'],
          },
          video_label: { name: 'LBL_STORY_VIDEO' },
          title_label: { name: 'LBL_COMMON' },
          body_label: { name: 'LBL_COMMON' },
          link_url_label: { name: 'LBL_COMMON' },
          call_to_action_label: { name: 'LBL_COMMON' },
          priority: 2,
        },
      ],
    },
    object_story_spec: {
      page_id: pageId,
    },
  })

  const response = await creative.create(['id', 'name'])
  const creativeId = response.id

  console.log(`✅ Creative created: ${creativeId}`)
  return creativeId
}

// ============================================================================
// 5. Create Ad
// ============================================================================

async function createAd(
  adAccountId: string,
  adSetId: string,
  creativeId: string
): Promise<string> {
  console.log(`📢 Creating Ad...`)

  const adAccount = new AdAccount(adAccountId)
  const ad = new Ad(null, adAccountId)

  ad.setParams({
    name: 'PAC Ad - Feed + Story',
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status: 'PAUSED',
  })

  const response = await ad.create(['id', 'name'])
  const adId = response.id

  console.log(`✅ Ad created: ${adId}`)
  return adId
}

// ============================================================================
// Main Flow
// ============================================================================

async function main() {
  const config: Config = {
    accessToken: process.env.FB_ACCESS_TOKEN!,
    adAccountId: process.env.AD_ACCOUNT_ID!, // Format: act_123456789
    pageId: process.env.PAGE_ID!,
    campaignId: process.env.CAMPAIGN_ID, // Optional - create one if not provided
  }

  if (!config.accessToken || !config.adAccountId || !config.pageId) {
    throw new Error('Missing required env vars: FB_ACCESS_TOKEN, AD_ACCOUNT_ID, PAGE_ID')
  }

  // Initialize SDK
  initSdk(config.accessToken)

  try {
    // Step 1: Upload Feed image (1:1 or 4:5)
    const { image_hash } = await uploadImage(
      config.adAccountId,
      './assets/feed-image.jpg' // 1:1 or 4:5 ratio
    )

    // Step 2: Upload Story video (9:16)
    const { video_id } = await uploadVideo(
      config.adAccountId,
      './assets/story-video.mp4' // 9:16 ratio
    )

    // Step 3: Create or use existing campaign
    let campaignId = config.campaignId
    if (!campaignId) {
      console.log('⚠️  No campaign ID provided, you should create one first')
      // Optionally create campaign here
      throw new Error('CAMPAIGN_ID required')
    }

    // Step 4: Create AdSet with Feed + Story placements
    const adSetId = await createAdSet(
      config.adAccountId,
      campaignId,
      config.pageId
    )

    // Step 5: Create PAC Creative
    const creativeId = await createPacCreative(
      config.adAccountId,
      config.pageId,
      image_hash,
      video_id,
      'https://example.com/demo'
    )

    // Step 6: Create Ad
    const adId = await createAd(config.adAccountId, adSetId, creativeId)

    console.log('\n🎉 PAC Ad Setup Complete!')
    console.log('================================')
    console.log(`AdSet ID:    ${adSetId}`)
    console.log(`Creative ID: ${creativeId}`)
    console.log(`Ad ID:       ${adId}`)
    console.log('================================')
    console.log('✅ Feed placement will show the image')
    console.log('✅ Story placement will show the video')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// ============================================================================
// BONUS: Get Insights with Asset Breakdown
// ============================================================================

async function getInsightsWithAssetBreakdown(
  adAccountId: string,
  adId: string
) {
  console.log(`📊 Fetching insights for ad: ${adId}`)

  const ad = new Ad(adId)

  const insights = await ad.getInsights(
    ['ad_id', 'ad_name', 'impressions', 'clicks', 'spend'],
    {
      level: 'ad',
      breakdowns: ['ad_format_asset'],
    }
  )

  console.log('Insights by asset:')
  insights.forEach((insight: any) => {
    console.log({
      ad_format_asset: insight.ad_format_asset,
      impressions: insight.impressions,
      clicks: insight.clicks,
      spend: insight.spend,
    })
  })

  return insights
}

// Export for use as module
export {
  uploadImage,
  uploadVideo,
  createAdSet,
  createPacCreative,
  createAd,
  getInsightsWithAssetBreakdown,
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}
