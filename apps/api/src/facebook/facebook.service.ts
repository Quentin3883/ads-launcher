import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'
import * as SDKImport from '@launcher-ads/sdk'
import { FacebookApiClient } from './services/facebook-api-client.service'

const FACEBOOK_CTA_MAP = SDKImport.FACEBOOK_CTA_MAP || {
  'Learn More': 'LEARN_MORE',
  'Shop Now': 'SHOP_NOW',
  'Sign Up': 'SIGN_UP',
  'Download': 'DOWNLOAD',
  'Watch More': 'WATCH_MORE',
  'Contact Us': 'CONTACT_US',
  'Book Now': 'BOOK_NOW',
  'Get Quote': 'GET_QUOTE',
  'Apply Now': 'APPLY_NOW',
  'Subscribe': 'SUBSCRIBE',
  'See Menu': 'SEE_MENU',
  'Get Offer': 'GET_OFFER',
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly apiVersion = process.env.FACEBOOK_API_VERSION || 'v24.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiClient: FacebookApiClient,
  ) {}

  // ============================================================================
  // HELPER METHODS - Ad Set Optimization & Promoted Object
  // ============================================================================

  /**
   * Maps user-friendly optimization event names to Facebook API optimization goals
   * @see https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/
   */
  private readonly OPTIMIZATION_EVENT_TO_GOAL_MAP: Record<string, string> = {
    'Link Clicks': 'LINK_CLICKS',
    'Landing Page Views': 'LANDING_PAGE_VIEWS',
    'Impressions': 'IMPRESSIONS',
    'Reach': 'REACH',
    'Conversions': 'OFFSITE_CONVERSIONS',
    'Leads': 'OFFSITE_CONVERSIONS', // For OUTCOME_LEADS with website, use OFFSITE_CONVERSIONS
    'Post Engagement': 'POST_ENGAGEMENT',
    'Video Views': 'VIDEO_VIEWS',
    'ThruPlay': 'THRUPLAY',
  }

  /**
   * Get the Facebook API optimization goal from user's selected optimization event
   */
  private getOptimizationGoal(optimizationEvent: string | undefined): string {
    if (!optimizationEvent) {
      return 'LINK_CLICKS' // Default fallback
    }
    return this.OPTIMIZATION_EVENT_TO_GOAL_MAP[optimizationEvent] || 'LINK_CLICKS'
  }

  /**
   * Builds the promoted_object for an ad set based on optimization goal and campaign settings
   *
   * Facebook promoted_object rules (v24.0):
   * @see https://developers.facebook.com/docs/marketing-api/outcome-objectives
   *
   * QUALITY_LEAD / LEAD_GENERATION:
   *   - promoted_object: { page_id }
   *
   * OFFSITE_CONVERSIONS / LANDING_PAGE_VIEWS:
   *   - promoted_object: { pixel_id, custom_event_type, [custom_event_str], [custom_conversion_id] }
   *
   * LINK_CLICKS / REACH / IMPRESSIONS (with conversion tracking):
   *   - promoted_object: { pixel_id, custom_event_type, [custom_event_str], [custom_conversion_id] }
   *   - Only include if user explicitly selected conversion tracking
   *
   * @param optimizationGoal - Facebook API optimization goal (e.g., 'OFFSITE_CONVERSIONS')
   * @param campaignObjective - Campaign objective (e.g., 'OUTCOME_LEADS')
   * @param pageId - Facebook Page ID
   * @param pixelId - Facebook Pixel ID (optional)
   * @param customEventType - Custom event type (optional)
   * @param customEventStr - Custom event string for 'OTHER' type (optional)
   * @param customConversionId - Custom conversion ID (optional)
   */
  private buildPromotedObject(params: {
    optimizationGoal: string
    campaignObjective: string
    pageId: string
    pixelId?: string
    customEventType?: string
    customEventStr?: string
    customConversionId?: string
  }): any {
    const {
      optimizationGoal,
      campaignObjective,
      pageId,
      pixelId,
      customEventType,
      customEventStr,
      customConversionId,
    } = params

    // Case 1: QUALITY_LEAD or LEAD_GENERATION - Only page_id
    if (optimizationGoal === 'QUALITY_LEAD' || optimizationGoal === 'LEAD_GENERATION') {
      return { page_id: pageId }
    }

    // Case 2: OFFSITE_CONVERSIONS or LANDING_PAGE_VIEWS - Require pixel + event
    if (pixelId && (optimizationGoal === 'OFFSITE_CONVERSIONS' || optimizationGoal === 'LANDING_PAGE_VIEWS')) {
      const promotedObject: any = { pixel_id: pixelId }

      // Add custom event type (required for these goals)
      if (customEventType) {
        promotedObject.custom_event_type = customEventType
        if (customEventType === 'OTHER' && customEventStr) {
          promotedObject.custom_event_str = customEventStr
        }
      } else if (campaignObjective === 'OUTCOME_LEADS') {
        // Default to LEAD for OUTCOME_LEADS campaigns
        promotedObject.custom_event_type = 'LEAD'
      }

      // Add custom conversion if specified
      if (customConversionId) {
        promotedObject.custom_conversion_id = customConversionId
      }

      return promotedObject
    }

    // Case 3: LINK_CLICKS, REACH, IMPRESSIONS - Only if explicitly tracking conversions
    if (
      pixelId &&
      (customEventType || customConversionId) &&
      (optimizationGoal === 'LINK_CLICKS' || optimizationGoal === 'REACH' || optimizationGoal === 'IMPRESSIONS')
    ) {
      const promotedObject: any = { pixel_id: pixelId }

      if (customEventType) {
        promotedObject.custom_event_type = customEventType
        if (customEventType === 'OTHER' && customEventStr) {
          promotedObject.custom_event_str = customEventStr
        }
      }

      if (customConversionId) {
        promotedObject.custom_conversion_id = customConversionId
      }

      return promotedObject
    }

    // Case 4: Fallback for OUTCOME_LEADS without pixel
    if (campaignObjective === 'OUTCOME_LEADS') {
      return { page_id: pageId }
    }

    // Case 5: No promoted_object needed
    return undefined
  }

  /**
   * Builds call_to_action object with proper formatting for Facebook API
   *
   * @param cta - Call to action type from frontend
   * @param destination - Destination configuration
   * @param displayLink - Optional link caption override
   * @returns Call to action object for Facebook API
   */
  private buildCallToAction(params: {
    cta: string
    destination: any
    displayLink?: string
  }): any {
    const { cta, destination, displayLink } = params

    const callToAction: any = {
      type: FACEBOOK_CTA_MAP[cta] || cta,
    }

    // Add destination based on type
    if (destination.type === 'LANDING_PAGE') {
      callToAction.value = {
        link: destination.url,
        ...(displayLink && { link_caption: displayLink }),
      }
    } else if (destination.type === 'LEAD_FORM') {
      callToAction.value = {
        lead_gen_form_id: destination.formId,
      }
    } else if (destination.type === 'DEEPLINK') {
      callToAction.value = {
        application: destination.deeplink,
      }
    }

    return callToAction
  }

  /**
   * Builds asset customization rules for PAC (Placement Asset Customization)
   *
   * These rules determine which assets (images/videos) are shown on which placements
   * Rule 1: Stories/Reels/Search → Portrait assets (9:16)
   * Rule 2: Feed/Default → Square/Landscape assets (1:1 or 16:9)
   *
   * @param assetType - 'image' or 'video'
   * @param feedLabel - Label name for feed asset (e.g., 'LBL_FEED_VIDEO')
   * @param storyLabel - Label name for story asset (e.g., 'LBL_STORY_VIDEO')
   * @returns Array of asset customization rules
   */
  private buildAssetCustomizationRules(params: {
    assetType: 'image' | 'video'
    feedLabel: string
    storyLabel: string
  }): any[] {
    const { assetType, feedLabel, storyLabel } = params
    const labelKey = assetType === 'image' ? 'image_label' : 'video_label'

    return [
      // Rule 1: All Stories/Reels/Search placements (portrait asset)
      {
        customization_spec: {
          age_max: 65,
          age_min: 13,
          publisher_platforms: ['facebook', 'instagram', 'audience_network', 'messenger'],
          facebook_positions: ['story'],
          instagram_positions: ['ig_search', 'story', 'reels'],
          messenger_positions: ['story'],
          audience_network_positions: ['classic', 'rewarded_video'],
        },
        [labelKey]: { name: storyLabel },
        body_label: { name: 'LBL_COMMON' },
        link_url_label: { name: 'LBL_COMMON' },
        title_label: { name: 'LBL_COMMON' },
        priority: 1,
      },
      // Rule 2: Default/fallback for everything else (Feed - square/landscape asset)
      {
        customization_spec: {
          age_max: 65,
          age_min: 13,
        },
        [labelKey]: { name: feedLabel },
        body_label: { name: 'LBL_COMMON' },
        link_url_label: { name: 'LBL_COMMON' },
        title_label: { name: 'LBL_COMMON' },
        priority: 2,
      },
    ]
  }

  /**
   * Builds asset_feed_spec for PAC video creative
   *
   * @param videoIdFeed - Video ID for feed placements
   * @param videoIdStory - Video ID for story/reels placements
   * @param primaryText - Ad primary text/body
   * @param headline - Ad headline/title
   * @param destinationUrl - Landing page URL
   * @param displayLink - Optional link caption
   * @param cta - Call to action type
   * @returns Complete asset_feed_spec object
   */
  private buildPacVideoAssetFeedSpec(params: {
    videoIdFeed: string
    videoIdStory: string
    primaryText: string
    headline: string
    destinationUrl: string
    displayLink?: string
    cta: string
  }): any {
    const { videoIdFeed, videoIdStory, primaryText, headline, destinationUrl, displayLink, cta } = params

    return {
      ad_formats: ['AUTOMATIC_FORMAT'],
      videos: [
        {
          video_id: videoIdFeed,
          adlabels: [{ name: 'LBL_FEED_VIDEO' }],
        },
        {
          video_id: videoIdStory,
          adlabels: [{ name: 'LBL_STORY_VIDEO' }],
        },
      ],
      bodies: [
        {
          text: primaryText,
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      titles: [
        {
          text: headline,
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      descriptions: [{ text: '' }],
      link_urls: [
        {
          website_url: destinationUrl || '',
          ...(displayLink && { display_link: displayLink }),
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      call_to_action_types: [FACEBOOK_CTA_MAP[cta] || cta],
      asset_customization_rules: this.buildAssetCustomizationRules({
        assetType: 'video',
        feedLabel: 'LBL_FEED_VIDEO',
        storyLabel: 'LBL_STORY_VIDEO',
      }),
      optimization_type: 'PLACEMENT',
      additional_data: {
        multi_share_end_card: false,
        is_click_to_message: false,
      },
      reasons_to_shop: false,
      shops_bundle: false,
    }
  }

  /**
   * Builds asset_feed_spec for PAC image creative
   *
   * @param imageHashFeed - Image hash for feed placements
   * @param imageHashStory - Image hash for story/reels placements
   * @param primaryText - Ad primary text/body
   * @param headline - Ad headline/title
   * @param destinationUrl - Landing page URL
   * @param displayLink - Optional link caption
   * @param cta - Call to action type
   * @returns Complete asset_feed_spec object
   */
  private buildPacImageAssetFeedSpec(params: {
    imageHashFeed: string
    imageHashStory: string
    primaryText: string
    headline: string
    destinationUrl: string
    displayLink?: string
    cta: string
  }): any {
    const { imageHashFeed, imageHashStory, primaryText, headline, destinationUrl, displayLink, cta } = params

    return {
      ad_formats: ['AUTOMATIC_FORMAT'],
      images: [
        {
          hash: imageHashFeed,
          adlabels: [{ name: 'LBL_FEED_IMG' }],
        },
        {
          hash: imageHashStory,
          adlabels: [{ name: 'LBL_STORY_IMG' }],
        },
      ],
      bodies: [
        {
          text: primaryText,
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      titles: [
        {
          text: headline,
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      descriptions: [{ text: '' }],
      link_urls: [
        {
          website_url: destinationUrl || '',
          ...(displayLink && { display_link: displayLink }),
          adlabels: [{ name: 'LBL_COMMON' }],
        },
      ],
      call_to_action_types: [FACEBOOK_CTA_MAP[cta] || cta],
      asset_customization_rules: this.buildAssetCustomizationRules({
        assetType: 'image',
        feedLabel: 'LBL_FEED_IMG',
        storyLabel: 'LBL_STORY_IMG',
      }),
      optimization_type: 'PLACEMENT',
      additional_data: {
        multi_share_end_card: false,
        is_click_to_message: false,
      },
      reasons_to_shop: false,
      shops_bundle: false,
    }
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Save or update Facebook token for a user
   */
  async saveToken(userId: string, accessToken: string, expiresIn: number) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Check if token already exists
    const existingToken = await this.prisma.facebookToken.findFirst({
      where: { userId },
    })

    if (existingToken) {
      return this.prisma.facebookToken.update({
        where: { id: existingToken.id },
        data: {
          accessToken,
          expiresAt,
          updatedAt: new Date(),
        },
      })
    }

    return this.prisma.facebookToken.create({
      data: {
        userId,
        accessToken,
        expiresAt,
        scopes: [
          'ads_management',
          'ads_read',
          'business_management',
          'read_insights',
        ],
      },
    })
  }

  /**
   * Get user's Facebook token
   */
  async getToken(userId: string) {
    return this.prisma.facebookToken.findFirst({
      where: { userId },
      include: {
        adAccounts: {
          include: {
            client: true,
          },
        },
      },
    })
  }

  /**
   * Fetch ad accounts from Facebook API
   */
  async fetchAdAccounts(accessToken: string) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'me/adaccounts',
      accessToken,
      {
        fields: 'id,name,account_status,currency,timezone_name,business',
      },
      'Fetch ad accounts',
    )

    return response.data
  }

  /**
   * Save ad accounts to database
   * Optimized to avoid N+1 queries by batch fetching existing accounts
   */
  async saveAdAccounts(tokenId: string, accounts: any[]) {
    if (accounts.length === 0) return []

    // Batch fetch all existing accounts in one query
    const facebookIds = accounts.map((a) => a.id)
    const existingAccounts = await this.prisma.facebookAdAccount.findMany({
      where: {
        facebookId: { in: facebookIds },
      },
    })

    // Create a map for quick lookup
    const existingMap = new Map(existingAccounts.map((a) => [a.facebookId, a]))

    // Prepare batch operations
    const operations = accounts.map((account) => {
      const existing = existingMap.get(account.id)
      const data = {
        name: account.name,
        accountStatus: String(account.account_status),
        currency: account.currency,
        timezone: account.timezone_name,
        businessName: account.business?.name,
        businessId: account.business?.id,
      }

      if (existing) {
        // Update existing account
        return this.prisma.facebookAdAccount.update({
          where: { id: existing.id },
          data,
        })
      } else {
        // Create new account
        return this.prisma.facebookAdAccount.create({
          data: {
            tokenId,
            facebookId: account.id,
            ...data,
          },
        })
      }
    })

    // Execute all operations in a transaction
    return await this.prisma.$transaction(operations)
  }

  /**
   * Fetch campaigns from a specific ad account
   */
  async fetchCampaigns(accessToken: string, adAccountId: string) {
    const response = await this.apiClient.get<{ data: any[] }>(
      `${adAccountId}/campaigns`,
      accessToken,
      {
        fields:
          'id,name,status,objective,daily_budget,lifetime_budget,bid_strategy,start_time,stop_time,created_time,updated_time',
        limit: 100,
      },
      'Fetch campaigns',
    )

    return response.data
  }

  /**
   * Fetch full campaign data including all ad sets and ads
   * Used for Edit Mode to populate launcher with existing campaign structure
   */
  async fetchCampaignFull(accessToken: string, campaignId: string) {
    // Fetch campaign details
    const campaignResponse = await this.apiClient.get<any>(
      campaignId,
      accessToken,
      {
        fields:
          'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,bid_strategy,start_time,stop_time,created_time,updated_time',
      },
      'Fetch campaign details',
    )

    // Fetch all ad sets for this campaign
    const adSetsResponse = await this.apiClient.get<{ data: any[] }>(
      `${campaignId}/adsets`,
      accessToken,
      {
        fields:
          'id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,targeting,start_time,end_time,created_time,updated_time',
        limit: 500,
      },
      'Fetch campaign ad sets',
    )

    // Fetch all ads for each ad set
    const adsPromises = adSetsResponse.data.map(async (adSet: any) => {
      const adsResponse = await this.apiClient.get<{ data: any[] }>(
        `${adSet.id}/ads`,
        accessToken,
        {
          fields:
            'id,name,status,adset_id,creative{id,name,object_story_spec,asset_feed_spec,image_url,video_id,thumbnail_url,effective_object_story_id},created_time,updated_time',
          limit: 500,
        },
        'Fetch ad set ads',
      )
      return {
        adSetId: adSet.id,
        ads: adsResponse.data,
      }
    })

    const adsResults = await Promise.all(adsPromises)

    // Build ads map by ad set ID
    const adsByAdSet = adsResults.reduce(
      (acc, result) => {
        acc[result.adSetId] = result.ads
        return acc
      },
      {} as Record<string, any[]>,
    )

    return {
      campaign: campaignResponse,
      adSets: adSetsResponse.data,
      ads: adsByAdSet,
    }
  }

  /**
   * Update campaign status (ACTIVE, PAUSED)
   */
  async updateCampaignStatus(
    accessToken: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED',
  ) {
    return await this.apiClient.post(
      campaignId,
      accessToken,
      { status },
      'Update campaign status',
    )
  }

  /**
   * Update campaign budget
   */
  async updateCampaignBudget(
    accessToken: string,
    campaignId: string,
    budget: { daily_budget?: number; lifetime_budget?: number },
  ) {
    return await this.apiClient.post(
      campaignId,
      accessToken,
      budget,
      'Update campaign budget',
    )
  }

  /**
   * Fetch campaign insights/metrics
   */
  async fetchCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset: string = 'last_30d',
  ) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            access_token: accessToken,
            date_preset: datePreset,
            fields:
              'campaign_id,campaign_name,impressions,clicks,unique_clicks,spend,reach,' +
              'actions,action_values,' +
              'video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_thruplay_watched_actions',
            level: 'campaign',
          },
        },
      )

      return response.data.data[0] || null
    } catch (error: any) {
      this.logger.error('Error fetching campaign insights', error.response?.data)
      return null
    }
  }

  /**
   * Fetch all campaigns with insights for all ad accounts
   */
  async fetchAllCampaignsWithInsights(
    accessToken: string,
    adAccountIds: string[],
    datePreset: string = 'last_30d',
  ) {
    const allCampaigns = []

    for (const adAccountId of adAccountIds) {
      try {
        // Fetch campaigns for this ad account
        const campaigns = await this.fetchCampaigns(accessToken, adAccountId)

        // Fetch insights for each campaign
        const campaignsWithInsights = await Promise.all(
          campaigns.map(async (campaign: any) => {
            const insights = await this.fetchCampaignInsights(
              accessToken,
              campaign.id,
              datePreset,
            )

            return {
              ...campaign,
              adAccountId,
              insights: insights || {
                impressions: 0,
                clicks: 0,
                spend: 0,
                reach: 0,
              },
            }
          }),
        )

        allCampaigns.push(...campaignsWithInsights)
      } catch (error) {
        this.logger.error(
          `Error fetching campaigns for ${adAccountId}`,
          error,
        )
      }
    }

    return allCampaigns
  }

  /**
   * Save campaign insights to database
   */
  async saveCampaignInsights(
    campaignFacebookId: string,
    insights: any,
    dateStart: Date,
    dateEnd: Date,
  ) {
    try {
      // Find campaign by Facebook ID
      const campaign = await this.prisma.facebookCampaign.findUnique({
        where: { facebookId: campaignFacebookId },
      })

      if (!campaign) {
        this.logger.warn(
          `Campaign ${campaignFacebookId} not found in database`,
        )
        return null
      }

      // Upsert insights (update if exists for same date range, create if not)
      const saved = await this.prisma.facebookCampaignInsight.upsert({
        where: {
          campaignId_dateStart_dateEnd: {
            campaignId: campaign.id,
            dateStart,
            dateEnd,
          },
        },
        update: {
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0'),
          spend: parseFloat(insights.spend || '0'),
          reach: insights.reach ? parseInt(insights.reach) : 0,
          updatedAt: new Date(),
        },
        create: {
          campaignId: campaign.id,
          dateStart,
          dateEnd,
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0'),
          spend: parseFloat(insights.spend || '0'),
          reach: insights.reach ? parseInt(insights.reach) : 0,
        },
      })

      return saved
    } catch (error) {
      this.logger.error('Error saving campaign insights', error)
      return null
    }
  }

  /**
   * Sync all campaigns with insights (Optimized to avoid N+1 queries)
   * Uses batch operations and parallel processing for better performance
   */
  async syncAllCampaignsWithInsights(
    userId: string,
    datePreset: string = 'last_30d',
  ) {
    try {
      const token = await this.getToken(userId)
      if (!token) {
        throw new Error('No Facebook token found')
      }

      const adAccountIds = token.adAccounts.map((acc) => acc.facebookId)

      // Calculate date range based on preset
      const { dateStart, dateEnd } = this.getDateRangeFromPreset(datePreset)

      // Batch fetch all ad accounts in one query
      const adAccounts = await this.prisma.facebookAdAccount.findMany({
        where: {
          facebookId: { in: adAccountIds },
        },
      })

      const adAccountMap = new Map(adAccounts.map((a) => [a.facebookId, a]))

      // Process each ad account
      for (const adAccountId of adAccountIds) {
        try {
          const adAccount = adAccountMap.get(adAccountId)
          if (!adAccount) continue

          // Fetch campaigns from Facebook
          const campaigns = await this.fetchCampaigns(
            token.accessToken,
            adAccountId,
          )

          if (campaigns.length === 0) continue

          // Prepare batch upsert operations for campaigns
          const campaignUpserts = campaigns.map((campaign) =>
            this.prisma.facebookCampaign.upsert({
              where: { facebookId: campaign.id },
              update: {
                name: campaign.name,
                status: campaign.status,
                objective: campaign.objective,
                dailyBudget: campaign.daily_budget
                  ? parseFloat(campaign.daily_budget) / 100
                  : null,
                lifetimeBudget: campaign.lifetime_budget
                  ? parseFloat(campaign.lifetime_budget) / 100
                  : null,
                bidStrategy: campaign.bid_strategy,
                startTime: campaign.start_time
                  ? new Date(campaign.start_time)
                  : null,
                stopTime: campaign.stop_time
                  ? new Date(campaign.stop_time)
                  : null,
                rawData: campaign,
                lastSyncedAt: new Date(),
              },
              create: {
                adAccountId: adAccount.id,
                facebookId: campaign.id,
                name: campaign.name,
                status: campaign.status,
                objective: campaign.objective,
                dailyBudget: campaign.daily_budget
                  ? parseFloat(campaign.daily_budget) / 100
                  : null,
                lifetimeBudget: campaign.lifetime_budget
                  ? parseFloat(campaign.lifetime_budget) / 100
                  : null,
                bidStrategy: campaign.bid_strategy,
                startTime: campaign.start_time
                  ? new Date(campaign.start_time)
                  : null,
                stopTime: campaign.stop_time
                  ? new Date(campaign.stop_time)
                  : null,
                rawData: campaign,
              },
            }),
          )

          // Execute all campaign upserts in a single transaction
          await this.prisma.$transaction(campaignUpserts)

          // Fetch insights for all campaigns in parallel
          const insightsPromises = campaigns.map((campaign) =>
            this.fetchCampaignInsights(
              token.accessToken,
              campaign.id,
              datePreset,
            ).then((insights) => ({ campaignId: campaign.id, insights })),
          )

          const insightsResults = await Promise.allSettled(insightsPromises)

          // Prepare batch insights save operations
          const insightsSavePromises = insightsResults
            .filter(
              (result): result is PromiseFulfilledResult<any> =>
                result.status === 'fulfilled' && result.value.insights !== null,
            )
            .map(({ value }) =>
              this.saveCampaignInsights(
                value.campaignId,
                value.insights,
                dateStart,
                dateEnd,
              ),
            )

          // Save all insights in parallel
          await Promise.allSettled(insightsSavePromises)

          this.logger.log(
            `Synced ${campaigns.length} campaigns for account ${adAccountId}`,
          )
        } catch (error) {
          this.logger.error(
            `Error syncing campaigns for ${adAccountId}`,
            error,
          )
        }
      }

      return { success: true, message: 'Campaigns synced successfully' }
    } catch (error) {
      this.logger.error('Error syncing campaigns', error)
      throw error
    }
  }

  /**
   * Get campaigns with insights from database
   */
  async getCampaignsWithInsightsFromDB(userId: string) {
    try {
      const token = await this.getToken(userId)
      if (!token) {
        return []
      }

      const adAccountIds = token.adAccounts.map((acc) => acc.id)

      const campaigns = await this.prisma.facebookCampaign.findMany({
        where: {
          adAccountId: { in: adAccountIds },
        },
        include: {
          insights: {
            orderBy: { dateStart: 'desc' },
            take: 1, // Get most recent insights
          },
          adAccount: {
            select: {
              facebookId: true,
              name: true,
            },
          },
        },
      })

      return campaigns.map((campaign) => ({
        id: campaign.facebookId,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        daily_budget: campaign.dailyBudget
          ? (campaign.dailyBudget * 100).toString()
          : null,
        lifetime_budget: campaign.lifetimeBudget
          ? (campaign.lifetimeBudget * 100).toString()
          : null,
        adAccountId: campaign.adAccount.facebookId,
        adAccountName: campaign.adAccount.name,
        insights: campaign.insights[0] || {
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
        },
      }))
    } catch (error) {
      this.logger.error('Error getting campaigns from DB', error)
      return []
    }
  }

  /**
   * Get client analytics with date filtering (2-step approach)
   * Step 1: Get insights filtered by date
   * Step 2: Get only campaigns/adsets/ads that have insights
   */
  async getClientAnalyticsByDate(
    clientId: string,
    dateStart?: string,
    dateEnd?: string,
    adAccountId?: string,
  ) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          adAccounts: {
            select: {
              id: true,
              name: true,
              facebookId: true,
              currency: true,
            },
          },
        },
      })

      if (!client) {
        throw new Error('Client not found')
      }

      // Filter by specific ad account if provided
      let adAccountIds = client.adAccounts.map((acc) => acc.id)
      if (adAccountId) {
        const specificAccount = client.adAccounts.find((acc) => acc.id === adAccountId)
        if (!specificAccount) {
          throw new Error('Ad account not found for this client')
        }
        adAccountIds = [adAccountId]
      }

      // Step 1: Get campaign insights filtered by date
      const campaignInsights = await this.prisma.facebookCampaignInsight.findMany({
        where: {
          campaign: {
            adAccountId: { in: adAccountIds },
          },
          ...(dateStart && { dateStart: { gte: new Date(dateStart) } }),
          ...(dateEnd && { dateEnd: { lte: new Date(dateEnd) } }),
        },
        include: {
          campaign: {
            select: {
              id: true,
              facebookId: true,
              name: true,
              status: true,
              objective: true,
              dailyBudget: true,
              lifetimeBudget: true,
              bidStrategy: true,
              adAccountId: true,
            },
          },
        },
        orderBy: { dateStart: 'desc' },
      })

      // Get unique campaign IDs that have insights
      const campaignIdsWithInsights = [...new Set(campaignInsights.map((i) => i.campaignId))]

      // Step 2: Get ad set insights for these campaigns
      const adSetInsights = await this.prisma.facebookAdSetInsight.findMany({
        where: {
          adSet: {
            campaignId: { in: campaignIdsWithInsights },
          },
          ...(dateStart && { dateStart: { gte: new Date(dateStart) } }),
          ...(dateEnd && { dateEnd: { lte: new Date(dateEnd) } }),
        },
        include: {
          adSet: {
            select: {
              id: true,
              facebookId: true,
              name: true,
              status: true,
              optimizationGoal: true,
              bidStrategy: true,
              dailyBudget: true,
              lifetimeBudget: true,
              targeting: true,
              campaignId: true,
            },
          },
        },
        orderBy: { dateStart: 'desc' },
      })

      // Get unique ad set IDs that have insights
      const adSetIdsWithInsights = [...new Set(adSetInsights.map((i) => i.adSetId))]

      // Step 3: Get ad insights for these ad sets
      const adInsights = await this.prisma.facebookAdInsight.findMany({
        where: {
          ad: {
            adSetId: { in: adSetIdsWithInsights },
          },
          ...(dateStart && { dateStart: { gte: new Date(dateStart) } }),
          ...(dateEnd && { dateEnd: { lte: new Date(dateEnd) } }),
        },
        include: {
          ad: {
            select: {
              id: true,
              facebookId: true,
              name: true,
              status: true,
              headline: true,
              primaryText: true,
              description: true,
              imageUrl: true,
              videoUrl: true,
              callToAction: true,
              linkUrl: true,
              adSetId: true,
            },
          },
        },
        orderBy: { dateStart: 'desc' },
      })

      // Build hierarchy: campaigns -> adSets -> ads
      const campaignsMap = new Map()

      // Group campaign insights by campaign
      for (const insight of campaignInsights) {
        if (!campaignsMap.has(insight.campaignId)) {
          campaignsMap.set(insight.campaignId, {
            ...insight.campaign,
            insights: [],
            adSets: new Map(),
          })
        }
        campaignsMap.get(insight.campaignId).insights.push({
          id: insight.id,
          dateStart: insight.dateStart,
          dateEnd: insight.dateEnd,
          impressions: insight.impressions,
          clicks: insight.clicks,
          spend: insight.spend,
          reach: insight.reach,
        })
      }

      // Group ad set insights by ad set and campaign
      for (const insight of adSetInsights) {
        const campaign = campaignsMap.get(insight.adSet.campaignId)
        if (!campaign) continue

        if (!campaign.adSets.has(insight.adSetId)) {
          campaign.adSets.set(insight.adSetId, {
            ...insight.adSet,
            insights: [],
            ads: new Map(),
          })
        }
        campaign.adSets.get(insight.adSetId).insights.push({
          id: insight.id,
          dateStart: insight.dateStart,
          dateEnd: insight.dateEnd,
          impressions: insight.impressions,
          clicks: insight.clicks,
          spend: insight.spend,
          reach: insight.reach,
        })
      }

      // Group ad insights by ad, ad set, and campaign
      for (const insight of adInsights) {
        let foundAdSet = null
        for (const campaign of campaignsMap.values()) {
          if (campaign.adSets.has(insight.ad.adSetId)) {
            foundAdSet = campaign.adSets.get(insight.ad.adSetId)
            break
          }
        }

        if (!foundAdSet) continue

        if (!foundAdSet.ads.has(insight.adId)) {
          foundAdSet.ads.set(insight.adId, {
            ...insight.ad,
            insights: [],
          })
        }
        foundAdSet.ads.get(insight.adId).insights.push({
          id: insight.id,
          dateStart: insight.dateStart,
          dateEnd: insight.dateEnd,
          impressions: insight.impressions,
          clicks: insight.clicks,
          spend: insight.spend,
          reach: insight.reach,
        })
      }

      // Convert Maps to arrays and group by ad account
      const adAccountsMap = new Map()
      for (const adAccount of client.adAccounts) {
        adAccountsMap.set(adAccount.id, {
          ...adAccount,
          campaigns: [],
        })
      }

      for (const campaign of campaignsMap.values()) {
        const adAccount = adAccountsMap.get(campaign.adAccountId)
        if (!adAccount) continue

        adAccount.campaigns.push({
          ...campaign,
          adSets: Array.from(campaign.adSets.values()).map((adSet: any) => ({
            ...adSet,
            ads: Array.from(adSet.ads.values()),
          })),
        })
      }

      return {
        client: {
          id: client.id,
          name: client.name,
          logoUrl: client.logoUrl,
        },
        adAccounts: Array.from(adAccountsMap.values()).filter(
          (acc) => acc.campaigns.length > 0,
        ),
      }
    } catch (error) {
      this.logger.error('Error getting client analytics by date', error)
      throw error
    }
  }

  /**
   * Helper: Get date range from preset
   */
  private getDateRangeFromPreset(preset: string): {
    dateStart: Date
    dateEnd: Date
  } {
    const dateEnd = new Date()
    let dateStart = new Date()

    switch (preset) {
      case 'today':
        dateStart = new Date()
        break
      case 'yesterday':
        dateStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
        dateEnd.setDate(dateEnd.getDate() - 1)
        break
      case 'last_7d':
        dateStart.setDate(dateStart.getDate() - 7)
        break
      case 'last_14d':
        dateStart.setDate(dateStart.getDate() - 14)
        break
      case 'last_30d':
        dateStart.setDate(dateStart.getDate() - 30)
        break
      case 'last_90d':
        dateStart.setDate(dateStart.getDate() - 90)
        break
      default:
        dateStart.setDate(dateStart.getDate() - 30)
    }

    return { dateStart, dateEnd }
  }

  /**
   * ============================================
   * CAMPAIGN LAUNCHER - Create Campaigns via Facebook API
   * ============================================
   */

  /**
   * Create a campaign on Facebook
   */
  async createCampaign(
    accessToken: string,
    adAccountId: string,
    campaignData: {
      name: string
      objective: string
      status?: 'PAUSED' | 'ACTIVE'
      special_ad_categories?: string[]
      daily_budget?: number
      lifetime_budget?: number
      bid_strategy?: string
      start_time?: string
      stop_time?: string
    },
  ) {
    return await this.apiClient.post(
      `${adAccountId}/campaigns`,
      accessToken,
      {
        name: campaignData.name,
        objective: campaignData.objective,
        status: campaignData.status || 'PAUSED',
        special_ad_categories: campaignData.special_ad_categories || [],
        ...(campaignData.daily_budget && {
          daily_budget: Math.round(campaignData.daily_budget * 100), // Convert to cents
        }),
        ...(campaignData.lifetime_budget && {
          lifetime_budget: Math.round(campaignData.lifetime_budget * 100),
        }),
        ...(campaignData.bid_strategy && {
          bid_strategy: campaignData.bid_strategy,
        }),
        ...(campaignData.start_time && { start_time: campaignData.start_time }),
        ...(campaignData.stop_time && { stop_time: campaignData.stop_time }),
      },
      'Create campaign',
    )
  }

  /**
   * Create an ad set on Facebook
   */
  async createAdSet(
    accessToken: string,
    adAccountId: string,
    adSetData: {
      name: string
      campaign_id: string
      status?: 'PAUSED' | 'ACTIVE'
      optimization_goal: string
      billing_event: string
      bid_amount?: number
      daily_budget?: number
      lifetime_budget?: number
      start_time?: string
      end_time?: string
      targeting: {
        geo_locations?: {
          countries?: string[]
          regions?: Array<{ key: string }>
          cities?: Array<{ key: string }>
        }
        age_min?: number
        age_max?: number
        genders?: number[]
        flexible_spec?: Array<{
          interests?: Array<{ id: string; name: string }>
        }>
        custom_audiences?: Array<{ id: string }>
      }
      promoted_object?: {
        pixel_id?: string
        custom_event_type?: string
        page_id?: string
        application_id?: string
      }
      destination_type?: string
    },
  ) {
    const payload = {
      name: adSetData.name,
      campaign_id: adSetData.campaign_id,
      status: adSetData.status || 'PAUSED',
      optimization_goal: adSetData.optimization_goal,
      billing_event: adSetData.billing_event,
      ...(adSetData.bid_amount && { bid_amount: adSetData.bid_amount }),
      ...(adSetData.daily_budget && {
        daily_budget: Math.round(adSetData.daily_budget * 100),
      }),
      ...(adSetData.lifetime_budget && {
        lifetime_budget: Math.round(adSetData.lifetime_budget * 100),
      }),
      ...(adSetData.start_time && { start_time: adSetData.start_time }),
      ...(adSetData.end_time && { end_time: adSetData.end_time }),
      targeting: JSON.stringify(adSetData.targeting),
      ...(adSetData.promoted_object && {
        promoted_object: JSON.stringify(adSetData.promoted_object),
      }),
      ...(adSetData.destination_type && {
        destination_type: adSetData.destination_type,
      }),
    }

    this.logger.log(`Creating ad set with payload: ${JSON.stringify(payload, null, 2)}`)

    return await this.apiClient.post(
      `${adAccountId}/adsets`,
      accessToken,
      payload,
      'Create ad set',
    )
  }

  /**
   * Create an ad creative on Facebook
   */
  async createAdCreative(
    accessToken: string,
    adAccountId: string,
    creativeData: {
      name: string
      object_story_spec?: {
        page_id: string
        link_data?: {
          link: string
          message: string
          name?: string
          description?: string
          call_to_action?: {
            type: string
            value?: {
              link?: string
              application?: string
              lead_gen_form_id?: string
            }
          }
          image_hash?: string
          video_id?: string
        }
        video_data?: {
          video_id: string
          message: string
          title?: string
          call_to_action?: {
            type: string
            value?: {
              link?: string
              application?: string
              lead_gen_form_id?: string
            }
          }
        }
      }
      asset_feed_spec?: any
      degrees_of_freedom_spec?: {
        creative_features_spec?: {
          standard_enhancements?: {
            enroll_status?: string
          }
        }
      }
      url_tags?: string
    },
  ) {
    const payload = {
      name: creativeData.name,
      ...(creativeData.object_story_spec && {
        object_story_spec: JSON.stringify(creativeData.object_story_spec),
      }),
      ...(creativeData.asset_feed_spec && {
        asset_feed_spec: JSON.stringify(creativeData.asset_feed_spec),
      }),
      ...(creativeData.degrees_of_freedom_spec && {
        degrees_of_freedom_spec: JSON.stringify(
          creativeData.degrees_of_freedom_spec,
        ),
      }),
      ...(creativeData.url_tags && {
        url_tags: creativeData.url_tags,
      }),
    }

    return await this.apiClient.post(
      `${adAccountId}/adcreatives`,
      accessToken,
      payload,
      'Create ad creative',
    )
  }

  /**
   * Upload image to Facebook
   */
  async uploadImage(
    accessToken: string,
    adAccountId: string,
    imageData: string,
    name?: string,
  ): Promise<{ hash: string; id: string }> {
    try {
      this.logger.log(`Uploading image${name ? ` (${name})` : ''}...`)

      // Check if it's a data URL (base64) or a blob URL
      if (imageData.startsWith('data:')) {
        // It's a base64 data URL - convert to buffer and upload as file
        const parts = imageData.split(',')
        const base64Data = parts[1]
        if (!base64Data) {
          throw new Error('Invalid base64 data URL: missing data part')
        }

        const mimeTypePart = imageData.split(';')[0]
        const mimeType = mimeTypePart ? mimeTypePart.split(':')[1] || 'image/jpeg' : 'image/jpeg'
        const buffer = Buffer.from(base64Data, 'base64')

        // Determine file extension from MIME type
        const extensionMap: Record<string, string> = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
        }
        const extension = extensionMap[mimeType] || '.jpg'

        this.logger.log(`Uploading from base64 data (${mimeType}, ${buffer.length} bytes)`)

        // Use FormData to upload the file
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('access_token', accessToken)
        if (name) {
          formData.append('name', name)
          this.logger.log(`📝 Setting image name: "${name}"`)
        } else {
          this.logger.warn('⚠️  No name provided for image upload')
        }

        // Use name with correct extension for filename, or default to 'image' + extension
        const filename = name ? `${name}${extension}` : `image${extension}`
        formData.append('file', buffer, {
          filename: filename,
          contentType: mimeType,
        })

        const response = await axios.post(
          `${this.baseUrl}/${adAccountId}/adimages`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        )

        const imageDataResponse = Object.values(response.data.images)[0] as any
        this.logger.log(`Image uploaded successfully: id=${imageDataResponse.id}, hash=${imageDataResponse.hash}, width=${imageDataResponse.width}, height=${imageDataResponse.height}`)
        return { hash: imageDataResponse.hash, id: imageDataResponse.id }
      } else if (imageData.startsWith('blob:')) {
        // It's a blob URL - we can't access it from the backend
        throw new Error('Blob URLs are not supported. Please send the image as base64 data URL.')
      } else {
        // It's a regular URL
        this.logger.log(`Uploading from URL: ${imageData}`)

        const payload: any = { url: imageData }
        if (name) {
          payload.name = name
        }

        const response = await axios.post(
          `${this.baseUrl}/${adAccountId}/adimages`,
          payload,
          {
            params: {
              access_token: accessToken,
            },
          },
        )

        const imageDataResponse = Object.values(response.data.images)[0] as any
        this.logger.log(`Image uploaded successfully: id=${imageDataResponse.id}, hash=${imageDataResponse.hash}, width=${imageDataResponse.width}, height=${imageDataResponse.height}`)
        return { hash: imageDataResponse.hash, id: imageDataResponse.id }
      }
    } catch (error: any) {
      this.logger.error(`Error uploading image:`, error.response?.data)
      throw new Error(
        `Failed to upload image: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  /**
   * Upload video to Facebook
   */
  /**
   * Get preferred thumbnail URL for a video
   */
  /**
   * Wait for video to be ready for use in ads
   * Checks video status until it's ready or timeout
   */
  async waitForVideoReady(accessToken: string, videoId: string, uploadId?: string, fileName?: string): Promise<boolean> {
    const maxRetries = 20 // Increased for large videos (up to 60 seconds total)
    const retryDelay = 3000 // 3 seconds between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Checking video status ${videoId} (attempt ${attempt}/${maxRetries})...`)
        const response = await axios.get(
          `${this.baseUrl}/${videoId}`,
          {
            params: {
              access_token: accessToken,
              fields: 'status',
            },
          },
        )

        const statusData = response.data?.status
        const videoStatus = statusData?.video_status
        const uploadingPhase = statusData?.uploading_phase?.status
        const processingPhase = statusData?.processing_phase?.status
        const publishingPhase = statusData?.publishing_phase?.status

        this.logger.log(`Video ${videoId} status details:`)
        this.logger.log(`  - video_status: ${videoStatus}`)
        this.logger.log(`  - uploading_phase: ${uploadingPhase}`)
        this.logger.log(`  - processing_phase: ${processingPhase}`)
        this.logger.log(`  - publishing_phase: ${publishingPhase}`)

        // Check for errors first
        if (videoStatus === 'error') {
          this.logger.error(`❌ Video ${videoId} processing failed`)
          return false
        }

        // Wait for uploading phase to complete FIRST
        if (uploadingPhase && uploadingPhase !== 'complete') {
          if (attempt < maxRetries) {
            this.logger.log(`⏳ Video still uploading (${uploadingPhase}), waiting ${retryDelay / 1000} seconds...`)

            // Emit progress update
            if (uploadId) {
              const { UploadProgressManager } = await import('./controllers/facebook-media.controller')
              UploadProgressManager.emitProgress(uploadId, {
                status: 'uploading',
                progress: 100,
                fileName: fileName || 'Video',
                phase: 'finalizing',
              })
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
        }

        // Then check if video is fully ready
        if (videoStatus === 'ready' && processingPhase === 'complete') {
          this.logger.log(`✅ Video ${videoId} is ready for use`)

          // Emit completion
          if (uploadId) {
            const { UploadProgressManager } = await import('./controllers/facebook-media.controller')
            UploadProgressManager.emitProgress(uploadId, {
              status: 'completed',
              progress: 100,
              fileName: fileName || 'Video',
              phase: 'ready',
              videoId,
            })
            UploadProgressManager.completeStream(uploadId)
          }

          return true
        }

        // Still processing - wait and retry
        if (attempt < maxRetries) {
          this.logger.log(`⏳ Video still processing, waiting ${retryDelay / 1000} seconds before retry...`)

          // Emit processing progress
          if (uploadId) {
            const { UploadProgressManager } = await import('./controllers/facebook-media.controller')
            const processingProgress = Math.min(100, Math.round((attempt / maxRetries) * 100))
            UploadProgressManager.emitProgress(uploadId, {
              status: 'processing',
              progress: processingProgress,
              fileName: fileName || 'Video',
              phase: 'processing',
            })
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }

        this.logger.warn(`⚠️  Video ${videoId} timeout after ${maxRetries} attempts (${maxRetries * retryDelay / 1000}s total)`)
        return false
      } catch (error: any) {
        this.logger.error(`Error checking video status for ${videoId} (attempt ${attempt}/${maxRetries})`)

        // Log the full error details
        if (error.response?.data) {
          this.logger.error(`Facebook API Error:`, JSON.stringify(error.response.data, null, 2))
        } else {
          this.logger.error(error.message)
        }

        // If it's a "video still being processed" error, retry
        if (error.response?.data?.error_subcode === 1885252) {
          this.logger.log(`Video still being processed by Facebook, will retry...`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
        }

        // For other errors, if not last attempt, retry
        if (attempt < maxRetries) {
          this.logger.log(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }

        return false
      }
    }

    return false
  }

  async getVideoThumbnail(accessToken: string, videoId: string): Promise<string | null> {
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Fetching thumbnail for video ${videoId} (attempt ${attempt}/${maxRetries})...`)
        const response = await axios.get(
          `${this.baseUrl}/${videoId}`,
          {
            params: {
              access_token: accessToken,
              fields: 'thumbnails',
            },
          },
        )

        const thumbnails = response.data?.thumbnails?.data
        if (!thumbnails || thumbnails.length === 0) {
          this.logger.warn(`No thumbnails found for video ${videoId} on attempt ${attempt}`)

          // If not the last attempt, wait and retry
          if (attempt < maxRetries) {
            this.logger.log(`Waiting ${retryDelay / 1000} seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }

          return null
        }

        // Find preferred thumbnail
        const preferredThumbnail = thumbnails.find((t: any) => t.is_preferred === true)
        const thumbnailUrl = preferredThumbnail?.uri || thumbnails[0]?.uri || null
        this.logger.log(`✅ Found ${thumbnails.length} thumbnails, selected: ${thumbnailUrl ? thumbnailUrl.substring(0, 80) + '...' : 'none'}`)
        return thumbnailUrl
      } catch (error: any) {
        this.logger.error(`Error fetching thumbnail for video ${videoId} (attempt ${attempt}/${maxRetries})`, error.message)

        // If not the last attempt, wait and retry
        if (attempt < maxRetries) {
          this.logger.log(`Waiting ${retryDelay / 1000} seconds before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }

        this.logger.error(`Failed to fetch thumbnail after ${maxRetries} attempts`)
        return null
      }
    }

    return null
  }

  async uploadVideo(
    accessToken: string,
    adAccountId: string,
    videoData: string,
    title?: string,
    uploadId?: string,
    fileName?: string,
  ): Promise<{ videoId: string; thumbnailUrl: string | null }> {
    try {
      this.logger.log(`Uploading video${fileName ? ` (${fileName})` : ''}...`)

      // Emit initial progress
      if (uploadId) {
        const { UploadProgressManager } = await import('./controllers/facebook-media.controller')
        UploadProgressManager.emitProgress(uploadId, {
          status: 'uploading',
          progress: 0,
          fileName: fileName || 'Video',
          phase: 'starting',
        })
      }

      // Check if it's a data URL (base64) or a regular URL
      if (videoData.startsWith('data:')) {
        // It's a base64 data URL - use resumable upload
        const parts = videoData.split(',')
        const base64Data = parts[1]
        if (!base64Data) {
          throw new Error('Invalid base64 data URL: missing data part')
        }

        const mimeTypePart = videoData.split(';')[0]
        const mimeType = mimeTypePart ? mimeTypePart.split(':')[1] || 'video/mp4' : 'video/mp4'
        const buffer = Buffer.from(base64Data, 'base64')

        const fileSizeMB = buffer.length / 1024 / 1024
        this.logger.log(`Uploading video from base64 data (${mimeType}, ${fileSizeMB.toFixed(2)} MB)`)

        // Always use resumable upload API (works for all sizes)
        this.logger.log('Using resumable upload API...')

          // Step 1: Initialize resumable upload session
          const initPayload: any = {
            upload_phase: 'start',
            file_size: buffer.length,
          }

          if (fileName) {
            initPayload.title = fileName
            this.logger.log(`📝 Setting video title for resumable upload START: "${fileName}"`)
          } else {
            this.logger.warn('⚠️  No fileName provided for resumable upload')
          }
          if (title) {
            initPayload.title = title
          }

          this.logger.log(`Init payload: ${JSON.stringify(initPayload)}`)

          const initResponse = await axios.post(
            `${this.baseUrl}/${adAccountId}/advideos`,
            initPayload,
            {
              params: { access_token: accessToken },
            },
          )

          const { video_id, upload_session_id } = initResponse.data
          this.logger.log(`Resumable upload session started: video_id=${video_id}`)

          // Step 2: Upload video in chunks
          const chunkSize = 10 * 1024 * 1024 // 10MB chunks
          let offset = 0

          while (offset < buffer.length) {
            const chunk = buffer.slice(offset, offset + chunkSize)
            const FormData = require('form-data')
            const formData = new FormData()
            formData.append('access_token', accessToken)
            formData.append('upload_phase', 'transfer')
            formData.append('upload_session_id', upload_session_id)
            formData.append('start_offset', offset.toString())
            formData.append('video_file_chunk', chunk, {
              filename: 'chunk.mp4',
              contentType: 'application/octet-stream',
            })

            await axios.post(
              `${this.baseUrl}/${adAccountId}/advideos`,
              formData,
              {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
              },
            )

            offset += chunk.length
            const progress = ((offset / buffer.length) * 100).toFixed(1)
            this.logger.log(`Upload progress: ${progress}%`)

            // Emit progress update
            if (uploadId) {
              const { UploadProgressManager } = await import('./controllers/facebook-media.controller')
              UploadProgressManager.emitProgress(uploadId, {
                status: 'uploading',
                progress: parseFloat(progress),
                fileName: fileName || 'Video',
                phase: 'transferring',
              })
            }
          }

          // Step 3: Finalize upload with name and title
          const finishPayload: any = {
            upload_phase: 'finish',
            upload_session_id,
          }

          if (fileName) {
            finishPayload.title = fileName
            this.logger.log(`📝 Setting video title in FINISH phase: "${fileName}"`)
          }
          if (title) {
            finishPayload.title = title
          }

          this.logger.log(`Finish payload: ${JSON.stringify(finishPayload)}`)

          await axios.post(
            `${this.baseUrl}/${adAccountId}/advideos`,
            finishPayload,
            {
              params: { access_token: accessToken },
            },
          )

          this.logger.log(`Video uploaded successfully (resumable): id=${video_id}`)

          // Return immediately - status check will be done later
          this.logger.log(`✅ Upload complete at 100% for video ${video_id}`)
          return { videoId: video_id, thumbnailUrl: null }
      } else if (videoData.startsWith('blob:')) {
        // It's a blob URL - we can't access it from the backend
        throw new Error('Blob URLs are not supported. Please send the video as base64 data URL.')
      } else {
        // It's a regular URL
        this.logger.log(`Uploading video from URL: ${videoData}`)

        const payload: any = { file_url: videoData }
        if (title) {
          payload.title = title
        }

        const response = await axios.post(
          `${this.baseUrl}/${adAccountId}/advideos`,
          payload,
          {
            params: {
              access_token: accessToken,
            },
          },
        )

        this.logger.log(`Video uploaded successfully: id=${response.data.id}`)

        // Wait 3 seconds for Facebook to generate thumbnails
        this.logger.log('Waiting 3 seconds for thumbnail generation...')
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Fetch thumbnail
        const thumbnailUrl = await this.getVideoThumbnail(accessToken, response.data.id)
        return { videoId: response.data.id, thumbnailUrl }
      }
    } catch (error: any) {
      const fbError = error.response?.data?.error
      this.logger.error('Error uploading video', {
        message: fbError?.message || error.message,
        type: fbError?.type,
        code: fbError?.code,
        error_subcode: fbError?.error_subcode,
        fbtrace_id: fbError?.fbtrace_id,
        full_error: error.response?.data,
      })
      throw new Error(
        `Failed to upload video: ${fbError?.message || error.message}`,
      )
    }
  }

  /**
   * Get ad images from Meta Media Library
   */
  async getAdImages(accessToken: string, adAccountId: string, limit: number = 50) {
    try {
      this.logger.log(`Fetching ${limit} images from Media Library for ad account ${adAccountId}`)

      const response = await axios.get(
        `${this.baseUrl}/${adAccountId}/adimages`,
        {
          params: {
            access_token: accessToken,
            fields: 'hash,permalink_url,width,height,name,created_time,updated_time',
            limit,
          },
        },
      )

      this.logger.log(`✅ Found ${response.data.data?.length || 0} images in Media Library`)

      return response.data.data || []
    } catch (error: any) {
      this.logger.error('Error fetching ad images:', error.response?.data || error.message)
      throw new Error(`Failed to fetch ad images: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * Get ad videos from Meta Media Library
   */
  async getAdVideos(accessToken: string, adAccountId: string, limit: number = 50) {
    try {
      this.logger.log(`Fetching ${limit} videos from Media Library for ad account ${adAccountId}`)

      const response = await axios.get(
        `${this.baseUrl}/${adAccountId}/advideos`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,title,length,thumbnails,created_time,updated_time,status',
            limit,
          },
        },
      )

      this.logger.log(`✅ Found ${response.data.data?.length || 0} videos in Media Library`)

      // Format videos to include thumbnail URL
      const videos = (response.data.data || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        length: video.length,
        thumbnailUrl: video.thumbnails?.data?.[0]?.uri || null,
        createdTime: video.created_time,
        updatedTime: video.updated_time,
        status: video.status,
      }))

      return videos
    } catch (error: any) {
      this.logger.error('Error fetching ad videos:', error.response?.data || error.message)
      throw new Error(`Failed to fetch ad videos: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * Create an ad on Facebook
   */
  async createAd(
    accessToken: string,
    adAccountId: string,
    adData: {
      name: string
      adset_id: string
      creative_id: string
      status?: 'PAUSED' | 'ACTIVE'
    },
  ) {
    return await this.apiClient.post(
      `${adAccountId}/ads`,
      accessToken,
      {
        name: adData.name,
        adset_id: adData.adset_id,
        creative: { creative_id: adData.creative_id },
        status: adData.status || 'PAUSED',
      },
      'Create ad',
    )
  }

  /**
   * Launch full campaign structure (campaign + ad sets + ads)
   * Takes data from bulk launcher and creates everything on Facebook
   */
  async launchBulkCampaign(
    userId: string,
    adAccountId: string,
    launchData: {
      campaign: {
        name: string
        type: string
        objective: string
        budgetMode: 'CBO' | 'ABO'
        budgetType: 'daily' | 'lifetime'
        budget?: number
        startDate: string
        startTime?: string
        endDate?: string
        endTime?: string
        urlTags?: string
        displayLink?: string
      }
      adSets: Array<{
        name: string
        audience: {
          type: string
          name: string
          interests?: Array<string | { id: string; name: string }>
          customAudienceId?: string
        }
        placements: string[]
        geoLocations: {
          countries?: string[]
          regions?: Array<string | { key: string; name?: string }>
          cities?: Array<string | { key: string; name?: string }>
        }
        demographics: {
          ageMin: number
          ageMax: number
          gender: string
        }
        optimizationEvent: string
        budget?: number
        budgetType?: 'daily' | 'lifetime'
        ads: Array<{
          name: string
          format: string
          label?: string
          creativeUrl: string
          creativeUrlStory?: string
          headline: string
          primaryText: string
          cta: string
          destination: {
            type: string
            url?: string
            formId?: string
            deeplink?: string
          }
        }>
      }>
      facebookPageId: string
      facebookPixelId?: string
      instagramAccountId?: string
      customEventType?: string
      customEventStr?: string
      customConversionId?: string
    },
  ) {
    try {
      // Get access token
      const token = await this.getToken(userId)
      if (!token) {
        throw new Error('No Facebook token found')
      }

      // Get internal ad account
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
      })
      if (!adAccount) {
        throw new Error('Ad account not found')
      }

      const results = {
        campaign: null as any,
        adSets: [] as any[],
        ads: [] as any[],
        errors: [] as any[],
      }

      // Step 0: Get Instagram account ID
      const instagramAccountId = launchData.instagramAccountId
      if (instagramAccountId) {
        this.logger.log(`✅ Using Instagram account ID: ${instagramAccountId}`)
      } else {
        this.logger.log(`⚠️  No Instagram account ID provided - Instagram placements may not work`)
      }

      // Step 1: Create Campaign
      this.logger.log(`Creating campaign: ${launchData.campaign.name}`)

      // Helper function to build datetime strings
      const buildDateTime = (date: string, time?: string): string => {
        const timeValue = time || '12:00'
        return `${date}T${timeValue}:00`
      }

      // Build start_time: either 'NOW' or ISO datetime with time
      const startTime = launchData.campaign.startDate === 'NOW'
        ? 'NOW'
        : buildDateTime(launchData.campaign.startDate, launchData.campaign.startTime)

      // Build stop_time: ISO datetime with time if endDate is set
      const stopTime = launchData.campaign.endDate
        ? buildDateTime(launchData.campaign.endDate, launchData.campaign.endTime)
        : undefined

      const campaignData = {
        name: launchData.campaign.name,
        objective: launchData.campaign.objective,
        status: 'PAUSED' as const,
        special_ad_categories: [],
        // If using CBO (Campaign Budget Optimization), set bid_strategy at campaign level
        ...(launchData.campaign.budgetMode === 'CBO' && {
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        }),
        ...(launchData.campaign.budgetMode === 'CBO' &&
          launchData.campaign.budgetType === 'daily' && {
            daily_budget: launchData.campaign.budget,
          }),
        ...(launchData.campaign.budgetMode === 'CBO' &&
          launchData.campaign.budgetType === 'lifetime' && {
            lifetime_budget: launchData.campaign.budget,
          }),
        start_time: startTime,
        ...(stopTime && {
          stop_time: stopTime,
        }),
      }

      const createdCampaign = await this.createCampaign(
        token.accessToken,
        adAccount.facebookId,
        campaignData,
      )
      results.campaign = createdCampaign

      // Save campaign to database
      await this.prisma.facebookCampaign.create({
        data: {
          adAccountId: adAccount.id,
          facebookId: createdCampaign.id,
          name: launchData.campaign.name,
          status: 'PAUSED',
          objective: launchData.campaign.objective,
          dailyBudget:
            launchData.campaign.budgetMode === 'CBO' &&
            launchData.campaign.budgetType === 'daily'
              ? launchData.campaign.budget
              : null,
          lifetimeBudget:
            launchData.campaign.budgetMode === 'CBO' &&
            launchData.campaign.budgetType === 'lifetime'
              ? launchData.campaign.budget
              : null,
          startTime:
            launchData.campaign.startDate === 'NOW'
              ? new Date() // Use current time for 'NOW'
              : new Date(startTime), // Use the ISO datetime string we built
          stopTime: stopTime ? new Date(stopTime) : null,
          rawData: createdCampaign,
        },
      })

      // Step 2: Create Ad Sets
      for (const adSetConfig of launchData.adSets) {
        try {
          this.logger.log(`Creating ad set: ${adSetConfig.name}`)

          // Build targeting
          const targeting: any = {
            age_min: adSetConfig.demographics.ageMin,
            age_max: adSetConfig.demographics.ageMax,
            // Add all placements (Facebook, Instagram, Audience Network, Messenger)
            publisher_platforms: ['facebook', 'instagram', 'audience_network', 'messenger'],
            facebook_positions: ['feed', 'story'],
            instagram_positions: ['stream', 'ig_search', 'story', 'explore', 'reels', 'explore_home'],
            device_platforms: ['mobile', 'desktop'],
            messenger_positions: ['story'],
            audience_network_positions: ['classic', 'rewarded_video'],
          }

          // Build geo_locations with support for countries, regions, and cities
          const geoLocations: any = {}
          if (adSetConfig.geoLocations.countries && adSetConfig.geoLocations.countries.length > 0) {
            geoLocations.countries = adSetConfig.geoLocations.countries
          }
          if (adSetConfig.geoLocations.regions && adSetConfig.geoLocations.regions.length > 0) {
            geoLocations.regions = adSetConfig.geoLocations.regions.map((region: any) =>
              typeof region === 'string' ? { key: region } : region
            )
          }
          if (adSetConfig.geoLocations.cities && adSetConfig.geoLocations.cities.length > 0) {
            geoLocations.cities = adSetConfig.geoLocations.cities.map((city: any) =>
              typeof city === 'string' ? { key: city } : city
            )
          }

          // Only add geo_locations if at least one location type is specified
          if (Object.keys(geoLocations).length > 0) {
            targeting.geo_locations = geoLocations
          }

          // Add gender (1 = male, 2 = female)
          if (adSetConfig.demographics.gender === 'Male') {
            targeting.genders = [1]
          } else if (adSetConfig.demographics.gender === 'Female') {
            targeting.genders = [2]
          }

          // Add interests - support both string IDs and objects with id/name
          if (
            adSetConfig.audience.type === 'INTEREST' &&
            adSetConfig.audience.interests &&
            adSetConfig.audience.interests.length > 0
          ) {
            const interestObjects = adSetConfig.audience.interests.map((interest: any) => {
              // If it's already an object with id, use it
              if (typeof interest === 'object' && interest.id) {
                return { id: interest.id, name: interest.name }
              }
              // If it's a string that looks like a numeric ID, use it
              if (typeof interest === 'string' && /^\d+$/.test(interest)) {
                return { id: interest }
              }
              return null
            }).filter(Boolean)

            if (interestObjects.length > 0) {
              targeting.flexible_spec = [
                {
                  interests: interestObjects,
                },
              ]
            }
          }

          // Add custom audience
          if (
            adSetConfig.audience.type === 'CUSTOM_AUDIENCE' &&
            adSetConfig.audience.customAudienceId
          ) {
            targeting.custom_audiences = [
              { id: adSetConfig.audience.customAudienceId },
            ]
          }

          // Get optimization goal from user's selected optimization event
          const optimizationGoal = this.getOptimizationGoal(adSetConfig.optimizationEvent)

          // Build promoted_object using helper method
          const promotedObject = this.buildPromotedObject({
            optimizationGoal,
            campaignObjective: launchData.campaign.objective,
            pageId: launchData.facebookPageId,
            pixelId: launchData.facebookPixelId,
            customEventType: launchData.customEventType,
            customEventStr: launchData.customEventStr,
            customConversionId: launchData.customConversionId,
          })

          const adSetData = {
            name: adSetConfig.name,
            campaign_id: createdCampaign.id,
            status: 'ACTIVE' as const,
            optimization_goal: optimizationGoal,
            billing_event: 'IMPRESSIONS',
            targeting,
            is_dynamic_creative: false, // CRITICAL: PAC ≠ Dynamic Creative
            // If using ABO (Ad Set Budget Optimization), we need bid_strategy at ad set level
            ...(launchData.campaign.budgetMode === 'ABO' && {
              bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            }),
            ...(launchData.campaign.budgetMode === 'ABO' &&
              adSetConfig.budgetType === 'daily' && {
                daily_budget: adSetConfig.budget,
              }),
            ...(launchData.campaign.budgetMode === 'ABO' &&
              adSetConfig.budgetType === 'lifetime' && {
                lifetime_budget: adSetConfig.budget,
              }),
            ...(promotedObject && { promoted_object: promotedObject }),
          }

          const createdAdSet = await this.createAdSet(
            token.accessToken,
            adAccount.facebookId,
            adSetData,
          )
          results.adSets.push(createdAdSet)

          // Save ad set to database
          const savedAdSet = await this.prisma.facebookAdSet.create({
            data: {
              campaignId: (
                await this.prisma.facebookCampaign.findUnique({
                  where: { facebookId: createdCampaign.id },
                })
              )!.id,
              facebookId: createdAdSet.id,
              name: adSetConfig.name,
              status: 'ACTIVE',
              optimizationGoal: adSetConfig.optimizationEvent,
              bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
              dailyBudget:
                launchData.campaign.budgetMode === 'ABO' &&
                adSetConfig.budgetType === 'daily'
                  ? adSetConfig.budget
                  : null,
              lifetimeBudget:
                launchData.campaign.budgetMode === 'ABO' &&
                adSetConfig.budgetType === 'lifetime'
                  ? adSetConfig.budget
                  : null,
              targeting: targeting,
              rawData: createdAdSet,
            },
          })

          // Step 3: Create Ads for this Ad Set
          for (const adConfig of adSetConfig.ads) {
            try {
              this.logger.log(`Creating ad: ${adConfig.name}`)

              // Log without base64 to avoid cluttering logs
              this.logger.log(`Ad format: ${adConfig.format}`)
              this.logger.log(`Has creativeUrl (Feed): ${!!adConfig.creativeUrl}`)
              this.logger.log(`Has creativeUrlStory (Story): ${!!adConfig.creativeUrlStory}`)
              if (adConfig.creativeUrlStory) {
                this.logger.log(`✅ Story format detected - will use PAC`)
              } else {
                this.logger.log(`⚠️  No Story format - will use single image`)
              }

              // Upload creative (image or video) for Feed format
              let imageHashFeed: string | undefined
              let imageHashStory: string | undefined
              let imageIdFeed: string | undefined
              let imageIdStory: string | undefined
              let videoIdFeed: string | undefined
              let videoIdStory: string | undefined
              let videoThumbnailFeed: string | null | undefined
              let videoThumbnailStory: string | null | undefined

              if (adConfig.format === 'Image') {
                // Process Feed and Story images in parallel for better performance
                const imageProcessingTasks: Promise<void>[] = []

                // Task 1: Process Feed image
                const processFeedImage = async () => {
                  if (adConfig.creativeUrl.startsWith('fb-image-hash:')) {
                    // Extract hash from special format (from library)
                    imageHashFeed = adConfig.creativeUrl.replace('fb-image-hash:', '')
                    this.logger.log(`✅ Using library Feed image hash: ${imageHashFeed}`)
                  } else if (adConfig.creativeUrl.startsWith('https://facebook.com/image/')) {
                    // Extract image hash from URL (already uploaded)
                    imageHashFeed = adConfig.creativeUrl.split('/').pop()
                    this.logger.log(`✅ Using pre-uploaded Feed image hash: ${imageHashFeed}`)
                  } else {
                    // Upload image (base64 data URL or regular URL)
                    const result = await this.uploadImage(
                      token.accessToken,
                      adAccount.facebookId,
                      adConfig.creativeUrl,
                      `${adConfig.name} - Feed`,
                    )
                    imageHashFeed = result.hash
                    imageIdFeed = result.id
                  }
                }

                imageProcessingTasks.push(processFeedImage())

                // Task 2: Process Story image (if available)
                if (adConfig.creativeUrlStory) {
                  const processStoryImage = async () => {
                    if (adConfig.creativeUrlStory!.startsWith('fb-image-hash:')) {
                      // Extract hash from special format (from library)
                      imageHashStory = adConfig.creativeUrlStory!.replace('fb-image-hash:', '')
                      this.logger.log(`✅ Using library Story image hash: ${imageHashStory}`)
                    } else if (adConfig.creativeUrlStory!.startsWith('https://facebook.com/image/')) {
                      // Extract image hash from URL (already uploaded)
                      imageHashStory = adConfig.creativeUrlStory!.split('/').pop()
                      this.logger.log(`✅ Using pre-uploaded Story image hash: ${imageHashStory}`)
                    } else {
                      // Upload image (base64 data URL or regular URL)
                      const result = await this.uploadImage(
                        token.accessToken,
                        adAccount.facebookId,
                        adConfig.creativeUrlStory!,
                        `${adConfig.name} - Story`,
                      )
                      imageHashStory = result.hash
                      imageIdStory = result.id
                    }
                  }

                  imageProcessingTasks.push(processStoryImage())
                }

                // Wait for all image processing to complete in parallel
                await Promise.all(imageProcessingTasks)
                this.logger.log(`✅ All images processed (Feed: ${!!imageHashFeed}, Story: ${!!imageHashStory})`)
              } else if (adConfig.format === 'Video') {
                // Process Feed and Story videos in parallel for better performance
                const videoProcessingTasks: Promise<void>[] = []

                // Task 1: Process Feed video
                const processFeedVideo = async () => {
                  if (adConfig.creativeUrl.startsWith('fb-video-id:')) {
                    // Extract video ID from special format (from library)
                    videoIdFeed = adConfig.creativeUrl.replace('fb-video-id:', '')
                    this.logger.log(`✅ Using library Feed video ID: ${videoIdFeed}`)

                    // Wait for video to be ready
                    const isReady = await this.waitForVideoReady(token.accessToken, videoIdFeed)
                    if (!isReady) {
                      throw new Error(`Library Feed video ${videoIdFeed} is not ready`)
                    }

                    // Fetch thumbnail for library video
                    videoThumbnailFeed = await this.getVideoThumbnail(token.accessToken, videoIdFeed)
                    this.logger.log(`✅ Fetched thumbnail for Feed video: ${videoThumbnailFeed ? 'success' : 'failed'}`)
                  } else if (adConfig.creativeUrl.startsWith('https://facebook.com/video/')) {
                    // Extract video ID from URL (already uploaded)
                    videoIdFeed = adConfig.creativeUrl.split('/').pop()
                    if (!videoIdFeed) {
                      throw new Error('Invalid video URL format')
                    }
                    this.logger.log(`✅ Using pre-uploaded Feed video ID: ${videoIdFeed}`)

                    // Wait for video to be ready
                    const isReady = await this.waitForVideoReady(token.accessToken, videoIdFeed)
                    if (!isReady) {
                      throw new Error(`Pre-uploaded Feed video ${videoIdFeed} is not ready`)
                    }

                    // Fetch thumbnail for pre-uploaded video
                    videoThumbnailFeed = await this.getVideoThumbnail(token.accessToken, videoIdFeed)
                    this.logger.log(`✅ Fetched thumbnail for Feed video: ${videoThumbnailFeed ? 'success' : 'failed'}`)
                  } else {
                    // Upload video (base64 data URL)
                    const result = await this.uploadVideo(
                      token.accessToken,
                      adAccount.facebookId,
                      adConfig.creativeUrl,
                      `${adConfig.name} - Feed`,
                    )
                    videoIdFeed = result.videoId
                    videoThumbnailFeed = result.thumbnailUrl
                    this.logger.log(`✅ Uploaded Feed video with thumbnail: ${videoThumbnailFeed ? 'success' : 'failed'}`)
                  }
                }

                videoProcessingTasks.push(processFeedVideo())

                // Task 2: Process Story video (if available)
                if (adConfig.creativeUrlStory) {
                  const processStoryVideo = async () => {
                    if (adConfig.creativeUrlStory!.startsWith('fb-video-id:')) {
                      // Extract video ID from special format (from library)
                      videoIdStory = adConfig.creativeUrlStory!.replace('fb-video-id:', '')
                      this.logger.log(`✅ Using library Story video ID: ${videoIdStory}`)

                      // Wait for video to be ready
                      const isReady = await this.waitForVideoReady(token.accessToken, videoIdStory)
                      if (!isReady) {
                        throw new Error(`Library Story video ${videoIdStory} is not ready`)
                      }

                      // Fetch thumbnail for library video
                      videoThumbnailStory = await this.getVideoThumbnail(token.accessToken, videoIdStory)
                      this.logger.log(`✅ Fetched thumbnail for Story video: ${videoThumbnailStory ? 'success' : 'failed'}`)
                    } else if (adConfig.creativeUrlStory!.startsWith('https://facebook.com/video/')) {
                      // Extract video ID from URL (already uploaded)
                      videoIdStory = adConfig.creativeUrlStory!.split('/').pop()
                      if (!videoIdStory) {
                        throw new Error('Invalid Story video URL format')
                      }
                      this.logger.log(`✅ Using pre-uploaded Story video ID: ${videoIdStory}`)

                      // Wait for video to be ready
                      const isReady = await this.waitForVideoReady(token.accessToken, videoIdStory)
                      if (!isReady) {
                        throw new Error(`Pre-uploaded Story video ${videoIdStory} is not ready`)
                      }

                      // Fetch thumbnail for pre-uploaded video
                      videoThumbnailStory = await this.getVideoThumbnail(token.accessToken, videoIdStory)
                      this.logger.log(`✅ Fetched thumbnail for Story video: ${videoThumbnailStory ? 'success' : 'failed'}`)
                    } else {
                      // Upload video (base64 data URL)
                      const result = await this.uploadVideo(
                        token.accessToken,
                        adAccount.facebookId,
                        adConfig.creativeUrlStory!,
                        `${adConfig.name} - Story`,
                      )
                      videoIdStory = result.videoId
                      videoThumbnailStory = result.thumbnailUrl
                      this.logger.log(`✅ Uploaded Story video with thumbnail: ${videoThumbnailStory ? 'success' : 'failed'}`)
                    }
                  }

                  videoProcessingTasks.push(processStoryVideo())
                }

                // Wait for all video processing to complete in parallel
                await Promise.all(videoProcessingTasks)
                this.logger.log(`✅ All videos processed (Feed: ${!!videoIdFeed}, Story: ${!!videoIdStory})`)
              }

              // Build creative object_story_spec
              const objectStorySpec: any = {
                page_id: launchData.facebookPageId,
              }

              // Add Instagram account ID if provided
              if (launchData.instagramAccountId) {
                objectStorySpec.instagram_user_id = launchData.instagramAccountId
              }

              // Build call to action using helper method
              this.logger.log(`DEBUG: FACEBOOK_CTA_MAP = ${JSON.stringify(FACEBOOK_CTA_MAP)}`)
              this.logger.log(`DEBUG: adConfig.cta = ${adConfig.cta}`)
              const callToAction = this.buildCallToAction({
                cta: adConfig.cta,
                destination: adConfig.destination,
                displayLink: launchData.campaign.displayLink,
              })

              let createdCreative: any

              if (adConfig.format === 'Video' && (videoIdFeed || videoIdStory)) {
                // For videos with multiple placements (Feed + Story in ONE ad)
                // IMPORTANT: Only create PAC if Feed and Story are DIFFERENT videos
                if (videoIdFeed && videoIdStory && videoIdFeed !== videoIdStory) {
                  // Build PAC video asset_feed_spec using helper method
                  const assetFeedSpec = this.buildPacVideoAssetFeedSpec({
                    videoIdFeed,
                    videoIdStory,
                    primaryText: adConfig.primaryText,
                    headline: adConfig.headline,
                    destinationUrl: adConfig.destination.url || '',
                    displayLink: launchData.campaign.displayLink,
                    cta: adConfig.cta,
                  })

                  // Build object_story_spec (required even for PAC)
                  const objectStorySpecPAC: any = {
                    page_id: launchData.facebookPageId,
                  }
                  if (launchData.instagramAccountId) {
                    objectStorySpecPAC.instagram_user_id = launchData.instagramAccountId
                  }

                  this.logger.log('Creating PAC video ad with asset_feed_spec (Feed vs Stories/Reels)')
                  this.logger.log('Object Story Spec:', JSON.stringify(objectStorySpecPAC, null, 2))
                  this.logger.log('Asset Feed Spec:', JSON.stringify(assetFeedSpec, null, 2))

                  createdCreative = await this.createAdCreative(
                    token.accessToken,
                    adAccount.facebookId,
                    {
                      name: `${adConfig.name} - Creative`,
                      object_story_spec: objectStorySpecPAC,
                      asset_feed_spec: assetFeedSpec,
                      ...(launchData.campaign.urlTags && { url_tags: launchData.campaign.urlTags }),
                    }
                  )
                } else {
                  // Single video format (either Feed or Story) - will be used for all placements
                  const videoId = videoIdFeed || videoIdStory
                  const videoThumbnail = videoThumbnailFeed || videoThumbnailStory

                  if (!videoId) {
                    throw new Error('No video ID available')
                  }

                  objectStorySpec.video_data = {
                    video_id: videoId,
                    message: adConfig.primaryText,
                    call_to_action: callToAction,
                  }

                  // Add thumbnail (required by Facebook API)
                  // NOTE: Facebook will save this thumbnail as a separate image in Media Library
                  if (videoThumbnail) {
                    objectStorySpec.video_data.image_url = videoThumbnail
                    this.logger.log(`Using video thumbnail: ${videoThumbnail.substring(0, 100)}...`)
                  }

                  this.logger.log(`Creating single video ad (${videoIdFeed ? 'Feed' : 'Story'} format for all placements)`)

                  createdCreative = await this.createAdCreative(
                    token.accessToken,
                    adAccount.facebookId,
                    {
                      name: `${adConfig.name} - Creative`,
                      object_story_spec: objectStorySpec,
                      ...(launchData.campaign.urlTags && { url_tags: launchData.campaign.urlTags }),
                    },
                  )
                }
              } else if (adConfig.format === 'Image' && (imageHashFeed || imageHashStory)) {
                // For images with multiple placements (Feed + Story in ONE ad)
                // IMPORTANT: Only create PAC if Feed and Story are DIFFERENT images
                if (imageHashFeed && imageHashStory && imageHashFeed !== imageHashStory) {
                  // Build PAC image asset_feed_spec using helper method
                  const assetFeedSpec = this.buildPacImageAssetFeedSpec({
                    imageHashFeed,
                    imageHashStory,
                    primaryText: adConfig.primaryText,
                    headline: adConfig.headline,
                    destinationUrl: adConfig.destination.url || '',
                    displayLink: launchData.campaign.displayLink,
                    cta: adConfig.cta,
                  })

                  // Build object_story_spec (required even for PAC)
                  const objectStorySpecPAC: any = {
                    page_id: launchData.facebookPageId,
                  }
                  if (launchData.instagramAccountId) {
                    objectStorySpecPAC.instagram_user_id = launchData.instagramAccountId
                  }

                  this.logger.log('Creating PAC ad with asset_feed_spec (Feed vs Stories/Reels)')
                  this.logger.log('Object Story Spec:', JSON.stringify(objectStorySpecPAC, null, 2))
                  this.logger.log('Asset Feed Spec:', JSON.stringify(assetFeedSpec, null, 2))

                  createdCreative = await this.createAdCreative(
                    token.accessToken,
                    adAccount.facebookId,
                    {
                      name: `${adConfig.name} - Creative`,
                      object_story_spec: objectStorySpecPAC,
                      asset_feed_spec: assetFeedSpec,
                      ...(launchData.campaign.urlTags && { url_tags: launchData.campaign.urlTags }),
                    },
                  )
                } else {
                  // Single image format (either Feed or Story) - will be used for all placements
                  const imageHash = imageHashFeed || imageHashStory

                  if (!imageHash) {
                    throw new Error('No image hash available')
                  }

                  objectStorySpec.link_data = {
                    link: adConfig.destination.url || '',
                    message: adConfig.primaryText,
                    name: adConfig.headline,
                    call_to_action: callToAction,
                    image_hash: imageHash,
                    ...(launchData.campaign.displayLink && {
                      display_link: launchData.campaign.displayLink,
                    }),
                  }

                  this.logger.log(`Creating single image ad (${imageHashFeed ? 'Feed' : 'Story'} format for all placements)`)

                  createdCreative = await this.createAdCreative(
                    token.accessToken,
                    adAccount.facebookId,
                    {
                      name: `${adConfig.name} - Creative`,
                      object_story_spec: objectStorySpec,
                      ...(launchData.campaign.urlTags && { url_tags: launchData.campaign.urlTags }),
                    },
                  )
                }
              }

              // Build ad name with format: (Label) Name [asset_id=xxx]
              let adName = adConfig.name
              const label = adConfig.label || (adConfig.format === 'Image' ? 'Static' : 'Video')

              // Get asset ID based on format
              let assetId = ''
              if (adConfig.format === 'Video') {
                assetId = videoIdFeed || videoIdStory || ''
              } else {
                // Use image ID if available (from upload), otherwise fall back to hash
                assetId = imageIdFeed || imageIdStory || imageHashFeed || imageHashStory || ''
              }

              if (label && assetId) {
                const assetType = adConfig.format === 'Video' ? 'video_id' : 'image_id'
                adName = `(${label}) ${adConfig.name} [${assetType}=${assetId}]`
              }

              // Create ad
              const createdAd = await this.createAd(
                token.accessToken,
                adAccount.facebookId,
                {
                  name: adName,
                  adset_id: createdAdSet.id,
                  creative_id: createdCreative.id,
                  status: 'ACTIVE',
                },
              )
              results.ads.push(createdAd)

              // Save ad to database
              await this.prisma.facebookAd.create({
                data: {
                  adSetId: savedAdSet.id,
                  facebookId: createdAd.id,
                  name: adName,
                  status: 'ACTIVE',
                  headline: adConfig.headline,
                  primaryText: adConfig.primaryText,
                  callToAction: adConfig.cta,
                  linkUrl: adConfig.destination.url,
                  imageUrl: adConfig.format === 'Image' ? adConfig.creativeUrl : null,
                  videoUrl: adConfig.format === 'Video' ? adConfig.creativeUrl : null,
                  rawData: createdAd,
                },
              })
            } catch (error: any) {
              this.logger.error(`Error creating ad ${adConfig.name}`, error)
              results.errors.push({
                type: 'ad',
                name: adConfig.name,
                error: error.message,
              })
            }
          }
        } catch (error: any) {
          this.logger.error(`Error creating ad set ${adSetConfig.name}`, error)
          results.errors.push({
            type: 'adSet',
            name: adSetConfig.name,
            error: error.message,
          })
        }
      }

      return {
        success: results.errors.length === 0,
        campaignId: createdCampaign.id,
        results,
      }
    } catch (error: any) {
      this.logger.error('Error launching bulk campaign', error)
      throw error
    }
  }

  /**
   * ============================================
   * TARGETING SEARCH - Facebook Targeting API
   * ============================================
   */

  /**
   * Search geo locations (countries, regions, cities, zips)
   * Uses Facebook Targeting Search API
   */
  async searchGeoLocations(
    accessToken: string,
    params: {
      q: string
      location_types: Array<'country' | 'region' | 'city' | 'zip' | 'country_group' | 'geo_market' | 'electoral_district'>
      country_code?: string
      region_id?: number
      limit?: number
    },
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adgeolocation',
        location_types: JSON.stringify(params.location_types),
        q: params.q,
        ...(params.country_code && { country_code: params.country_code }),
        ...(params.region_id && { region_id: params.region_id }),
        limit: params.limit || 25,
      },
      'Search geo locations',
    )

    return response.data
  }

  /**
   * Search interests for targeting
   */
  async searchInterests(
    accessToken: string,
    query: string,
    limit: number = 25,
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adinterest',
        q: query,
        limit,
      },
      'Search interests',
    )

    return response.data
  }

  /**
   * Get interest suggestions based on a list of interests
   */
  async getInterestSuggestions(
    accessToken: string,
    interests: string[],
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adinterestsuggestion',
        interest_list: JSON.stringify(interests),
      },
      'Get interest suggestions',
    )

    return response.data
  }

  /**
   * Validate interests
   */
  async validateInterests(
    accessToken: string,
    interests: string[],
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adinterestvalid',
        interest_list: JSON.stringify(interests),
      },
      'Validate interests',
    )

    return response.data
  }

  /**
   * Search behaviors for targeting
   */
  async searchBehaviors(accessToken: string) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adTargetingCategory',
        class: 'behaviors',
      },
      'Search behaviors',
    )

    return response.data
  }

  /**
   * Search education schools
   */
  async searchSchools(
    accessToken: string,
    query: string,
    limit: number = 25,
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adeducationschool',
        q: query,
        limit,
      },
      'Search schools',
    )

    return response.data
  }

  /**
   * Search work employers
   */
  async searchEmployers(
    accessToken: string,
    query: string,
    limit: number = 25,
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adworkemployer',
        q: query,
        limit,
      },
      'Search employers',
    )

    return response.data
  }

  /**
   * Search job titles
   */
  async searchJobTitles(
    accessToken: string,
    query: string,
    limit: number = 25,
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adworkposition',
        q: query,
        limit,
      },
      'Search job titles',
    )

    return response.data
  }

  /**
   * Get locale options for targeting
   */
  async searchLocales(
    accessToken: string,
    query: string,
    limit: number = 25,
  ) {
    const response = await this.apiClient.get<{ data: any[] }>(
      'search',
      accessToken,
      {
        type: 'adlocale',
        q: query,
        limit,
      },
      'Search locales',
    )

    return response.data
  }

  /**
   * Get Facebook Pages that the user can use for ads
   * Includes connected Instagram accounts when ad account ID is provided
   */
  async getUserPages(accessToken: string, adAccountId?: string) {
    // If ad account ID is provided, use promote_pages to get Instagram accounts with details
    if (adAccountId) {
      const response = await this.apiClient.get<{ data: any[] }>(
        `${adAccountId}/promote_pages`,
        accessToken,
        {
          fields: 'id,name,picture{url},access_token,connected_instagram_account{id,name,username,profile_picture_url}',
        },
        'Fetch promote pages with Instagram details',
      )
      return response.data || []
    }

    // Otherwise, use me/accounts (basic page list without Instagram)
    const response = await this.apiClient.get<{ data: any[] }>(
      'me/accounts',
      accessToken,
      {
        fields: 'id,name,picture,access_token',
      },
      'Fetch user pages',
    )

    return response.data || []
  }

  /**
   * Get Lead Forms for a Facebook Page
   */
  async getLeadForms(accessToken: string, pageId: string) {
    const response = await this.apiClient.get<{ data: any[] }>(
      `${pageId}/leadgen_forms`,
      accessToken,
      {
        fields: 'id,name',
      },
      'Fetch page lead forms',
    )

    return response.data || []
  }

  /**
   * Get Pixel Events (standard and custom events tracked by a pixel)
   * Returns aggregated event names from pixel stats
   */
  async getPixelEvents(accessToken: string, pixelId: string) {
    try {
      const response = await this.apiClient.get<{
        stats: {
          data: Array<{
            start_time: string
            aggregation: string
            data: Array<{ value: string; count: number }>
          }>
        }
      }>(
        `${pixelId}`,
        accessToken,
        {
          fields: 'stats',
        },
        'Fetch pixel events',
      )

      // Extract unique event names from stats
      const eventNames = new Set<string>()

      if (response.stats?.data) {
        for (const timeSlot of response.stats.data) {
          if (timeSlot.data) {
            for (const event of timeSlot.data) {
              eventNames.add(event.value)
            }
          }
        }
      }

      // Convert to array and sort
      return Array.from(eventNames).sort()
    } catch (error: any) {
      this.logger.error(`Failed to fetch pixel events: ${error?.message || error}`)
      return []
    }
  }

  /**
   * Get Custom Conversions for an Ad Account
   * Returns list of custom conversions with their associated pixel
   */
  async getCustomConversions(accessToken: string, adAccountId: string) {
    try {
      const response = await this.apiClient.get<{ data: any[] }>(
        `${adAccountId}/customconversions`,
        accessToken,
        {
          fields: 'id,name,custom_event_type,pixel{id,name}',
        },
        'Fetch custom conversions',
      )

      return response.data || []
    } catch (error: any) {
      this.logger.error(`Failed to fetch custom conversions: ${error?.message || error}`)
      return []
    }
  }

  /**
   * Get Pixels for an Ad Account
   * Returns list of Facebook Pixels associated with the ad account
   */
  async getAdAccountPixels(accessToken: string, adAccountId: string) {
    try {
      const response = await this.apiClient.get<{ data: any[] }>(
        `${adAccountId}/adspixels`,
        accessToken,
        {
          fields: 'id,name',
        },
        'Fetch ad account pixels',
      )

      return response.data || []
    } catch (error: any) {
      this.logger.error(`Failed to fetch ad account pixels: ${error?.message || error}`)
      return []
    }
  }
}
