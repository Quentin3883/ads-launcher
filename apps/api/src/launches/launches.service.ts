import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FacebookService } from '../facebook/facebook.service'
import { CreateBulkLaunchDto, CampaignType, RedirectionType, BudgetMode } from './dto/create-bulk-launch.dto'
import axios from 'axios'

@Injectable()
export class LaunchesService {
  private readonly logger = new Logger(LaunchesService.name)
  private readonly apiVersion = process.env.FACEBOOK_API_VERSION || 'v24.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookService: FacebookService,
  ) {}

  /**
   * Map campaign type to Meta objective
   */
  private mapCampaignTypeToObjective(type: CampaignType): string {
    const mapping: Record<CampaignType, string> = {
      [CampaignType.AWARENESS]: 'OUTCOME_AWARENESS',
      [CampaignType.TRAFFIC]: 'OUTCOME_TRAFFIC',
      [CampaignType.ENGAGEMENT]: 'OUTCOME_ENGAGEMENT',
      [CampaignType.LEADS]: 'OUTCOME_LEADS',
      [CampaignType.APP_PROMOTION]: 'OUTCOME_APP_PROMOTION',
      [CampaignType.SALES]: 'OUTCOME_SALES',
    }
    return mapping[type]
  }


  /**
   * Upload creative to Meta
   */
  private async uploadCreative(
    adAccountId: string,
    accessToken: string,
    creativeUrl: string,
    creativeName: string,
  ): Promise<string> {
    try {
      // For now, we assume the creative URL is already hosted
      // In production, you might want to upload files to Meta directly

      // Create AdImage from URL
      const response = await axios.post(
        `${this.baseUrl}/act_${adAccountId}/adimages`,
        {
          url: creativeUrl,
          name: creativeName,
        },
        {
          params: { access_token: accessToken },
        },
      )

      const imageHash = response.data.images[creativeName]?.hash
      if (!imageHash) {
        throw new BadRequestException('Failed to upload creative to Facebook')
      }

      return imageHash
    } catch (error: any) {
      this.logger.error(`Failed to upload creative: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Create a single ad creative
   */
  private async createAdCreative(
    adAccountId: string,
    accessToken: string,
    ad: any,
    pageId: string,
  ): Promise<string> {
    try {
      // Upload creative first if it's an image
      const imageHash = ad.format === 'Image'
        ? await this.uploadCreative(adAccountId, accessToken, ad.creativeUrl, ad.name)
        : null

      // Build creative object
      const creativeData: any = {
        name: ad.name,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            link: ad.finalUrlWithParams,
            message: ad.primaryText,
            name: ad.headline,
            call_to_action: {
              type: this.mapCTAToMetaType(ad.cta),
            },
          },
        },
      }

      // Add image/video
      if (ad.format === 'Image' && imageHash) {
        creativeData.object_story_spec.link_data.image_hash = imageHash
      } else if (ad.format === 'Video') {
        creativeData.object_story_spec.video_data = {
          video_id: ad.creativeUrl, // Assume video is already uploaded
          message: ad.primaryText,
          title: ad.headline,
          call_to_action: {
            type: this.mapCTAToMetaType(ad.cta),
            value: { link: ad.finalUrlWithParams },
          },
        }
        delete creativeData.object_story_spec.link_data
      }

      // Handle lead form
      if (ad.destination.type === RedirectionType.LEAD_FORM && ad.destination.formId) {
        creativeData.object_story_spec.link_data.call_to_action.type = 'LEARN_MORE'
        creativeData.object_story_spec.link_data.call_to_action.value = {
          lead_gen_form_id: ad.destination.formId,
        }
      }

      const response = await axios.post(
        `${this.baseUrl}/act_${adAccountId}/adcreatives`,
        creativeData,
        {
          params: { access_token: accessToken },
        },
      )

      return response.data.id
    } catch (error: any) {
      this.logger.error(`Failed to create ad creative: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Map CTA to Meta type
   */
  private mapCTAToMetaType(cta: string): string {
    const mapping: Record<string, string> = {
      'Learn More': 'LEARN_MORE',
      'Shop Now': 'SHOP_NOW',
      'Sign Up': 'SIGN_UP',
      'Get Quote': 'GET_QUOTE',
      'Download': 'DOWNLOAD',
      'Apply Now': 'APPLY_NOW',
      'Book Now': 'BOOK_TRAVEL',
      'Contact Us': 'CONTACT_US',
      'Subscribe': 'SUBSCRIBE',
      'Watch More': 'WATCH_MORE',
    }
    return mapping[cta] || 'LEARN_MORE'
  }

  /**
   * Build targeting spec for ad set
   */
  private buildTargetingSpec(adSet: any): any {
    const targeting: any = {
      geo_locations: {},
      age_min: adSet.demographics.ageMin,
      age_max: adSet.demographics.ageMax,
    }

    // Geo targeting
    if (adSet.geoLocations.countries?.length > 0) {
      targeting.geo_locations.countries = adSet.geoLocations.countries
    }
    if (adSet.geoLocations.regions?.length > 0) {
      targeting.geo_locations.regions = adSet.geoLocations.regions.map((r: string) => ({
        key: r,
      }))
    }
    if (adSet.geoLocations.cities?.length > 0) {
      targeting.geo_locations.cities = adSet.geoLocations.cities.map((c: string) => ({
        key: c,
      }))
    }

    // Gender
    if (adSet.demographics.gender !== 'All') {
      targeting.genders = [adSet.demographics.gender === 'Male' ? 1 : 2]
    }

    // Languages
    if (adSet.demographics.languages?.length > 0) {
      targeting.locales = adSet.demographics.languages
    }

    // Placements - Map from placement strings to Facebook API format
    if (adSet.placements && adSet.placements.length > 0) {
      const placementMapping = this.mapPlacementsToFacebookAPI(adSet.placements)
      Object.assign(targeting, placementMapping)
    }

    // Audience type targeting
    if (adSet.audience.type === 'INTEREST' && adSet.audience.interests?.length > 0) {
      targeting.flexible_spec = [
        {
          interests: adSet.audience.interests.map((interest: string) => ({
            id: interest, // In production, map interest name to Meta interest ID
            name: interest,
          })),
        },
      ]
    } else if (adSet.audience.type === 'CUSTOM_AUDIENCE' && adSet.audience.customAudienceId) {
      targeting.custom_audiences = [
        {
          id: adSet.audience.customAudienceId,
        },
      ]
    } else if (adSet.audience.type === 'LOOKALIKE' && adSet.audience.lookalikeSource) {
      // Lookalike audiences are set differently
      targeting.custom_audiences = [
        {
          id: adSet.audience.lookalikeSource,
        },
      ]
    }

    return targeting
  }

  /**
   * Map placement strings to Facebook API format
   * Converts friendly placement names like "Feed", "Stories" to API format
   */
  private mapPlacementsToFacebookAPI(placements: string[]): any {
    const result: any = {
      publisher_platforms: [] as string[],
      facebook_positions: [] as string[],
      instagram_positions: [] as string[],
      messenger_positions: [] as string[],
      audience_network_positions: [] as string[],
      device_platforms: ['mobile', 'desktop'],
    }

    placements.forEach((placement) => {
      const lower = placement.toLowerCase()

      // Facebook Feed
      if (lower.includes('facebook') && lower.includes('feed')) {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('feed')) result.facebook_positions.push('feed')
      }
      // Facebook Stories
      else if (lower.includes('facebook') && lower.includes('stor')) {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('story')) result.facebook_positions.push('story')
      }
      // Facebook Reels
      else if (lower.includes('facebook') && lower.includes('reel')) {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('video_feeds')) result.facebook_positions.push('video_feeds')
      }
      // Instagram Feed / Stream
      else if (lower.includes('instagram') && lower.includes('feed')) {
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('stream')) result.instagram_positions.push('stream')
      }
      // Instagram Stories
      else if (lower.includes('instagram') && lower.includes('stor')) {
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('story')) result.instagram_positions.push('story')
      }
      // Instagram Reels
      else if (lower.includes('instagram') && lower.includes('reel')) {
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('reels')) result.instagram_positions.push('reels')
      }
      // Instagram Explore
      else if (lower.includes('instagram') && lower.includes('explore')) {
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('explore')) result.instagram_positions.push('explore')
      }
      // Generic "Feed"
      else if (lower === 'feed') {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('feed')) result.facebook_positions.push('feed')
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('stream')) result.instagram_positions.push('stream')
      }
      // Generic "Stories"
      else if (lower === 'stories' || lower === 'story') {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('story')) result.facebook_positions.push('story')
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('story')) result.instagram_positions.push('story')
      }
      // Generic "Reels"
      else if (lower === 'reels' || lower === 'reel') {
        if (!result.publisher_platforms.includes('facebook')) result.publisher_platforms.push('facebook')
        if (!result.facebook_positions.includes('video_feeds')) result.facebook_positions.push('video_feeds')
        if (!result.publisher_platforms.includes('instagram')) result.publisher_platforms.push('instagram')
        if (!result.instagram_positions.includes('reels')) result.instagram_positions.push('reels')
      }
      // Messenger
      else if (lower.includes('messenger')) {
        if (!result.publisher_platforms.includes('messenger')) result.publisher_platforms.push('messenger')
        if (!result.messenger_positions.includes('messenger_home')) result.messenger_positions.push('messenger_home')
      }
    })

    // Clean up empty arrays
    if (result.facebook_positions.length === 0) delete result.facebook_positions
    if (result.instagram_positions.length === 0) delete result.instagram_positions
    if (result.messenger_positions.length === 0) delete result.messenger_positions
    if (result.audience_network_positions.length === 0) delete result.audience_network_positions

    this.logger.log(`Mapped placements: ${JSON.stringify(placements)} -> ${JSON.stringify(result)}`)

    return result
  }

  /**
   * Create Meta campaign via Graph API
   */
  async createBulkLaunch(dto: CreateBulkLaunchDto) {
    this.logger.log(`Creating bulk launch for client ${dto.clientId}`)

    // Get Facebook token
    const token = await this.facebookService.getToken(dto.userId)
    if (!token) {
      throw new BadRequestException('No Facebook token found. Please connect your Facebook account.')
    }

    const accessToken = token.accessToken

    // Get page ID from ad account (required for creatives)
    const pageId = process.env.META_PAGE_ID
    if (!pageId) {
      throw new BadRequestException('META_PAGE_ID environment variable is not configured')
    }

    try {
      // 1. Create Campaign
      this.logger.log(`Creating campaign: ${dto.campaign.name}`)

      const campaignData: any = {
        name: dto.campaign.name,
        objective: this.mapCampaignTypeToObjective(dto.campaign.type),
        status: 'PAUSED', // Start paused for safety
        special_ad_categories: [], // Update if needed
      }

      // CBO budget
      if (dto.campaign.budgetMode === BudgetMode.CBO && dto.campaign.budget) {
        if (dto.campaign.budgetType === 'daily') {
          campaignData.daily_budget = dto.campaign.budget * 100 // Meta uses cents
        } else {
          campaignData.lifetime_budget = dto.campaign.budget * 100
        }
      }

      const campaignResponse = await axios.post(
        `${this.baseUrl}/act_${dto.adAccountId}/campaigns`,
        campaignData,
        {
          params: { access_token: accessToken },
        },
      )

      const campaignId = campaignResponse.data.id
      this.logger.log(`Campaign created: ${campaignId}`)

      // 2. Create Ad Sets
      const createdAdSets = []
      const createdAds = []

      for (const adSet of dto.adSets) {
        this.logger.log(`Creating ad set: ${adSet.name} with ${adSet.ads.length} ads`)

        const adSetData: any = {
          name: adSet.name,
          campaign_id: campaignId,
          optimization_goal: adSet.optimizationEvent,
          billing_event: 'IMPRESSIONS',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: this.buildTargetingSpec(adSet),
          status: 'PAUSED',
          start_time: dto.campaign.startDate,
        }

        // End time (optional)
        if (dto.campaign.endDate) {
          adSetData.end_time = dto.campaign.endDate
        }

        // ABO budget
        if (dto.campaign.budgetMode === BudgetMode.ABO && adSet.budget) {
          if (adSet.budgetType === 'daily') {
            adSetData.daily_budget = adSet.budget * 100
          } else {
            adSetData.lifetime_budget = adSet.budget * 100
          }
        }

        const adSetResponse = await axios.post(
          `${this.baseUrl}/act_${dto.adAccountId}/adsets`,
          adSetData,
          {
            params: { access_token: accessToken },
          },
        )

        const adSetId = adSetResponse.data.id
        this.logger.log(`Ad set created: ${adSetId}`)
        createdAdSets.push({ ...adSet, metaAdSetId: adSetId })

        // 3. Create Ads for this Ad Set
        this.logger.log(`Will create ${adSet.ads.length} ads for ad set ${adSetId}`)
        for (const ad of adSet.ads) {
          this.logger.log(`Creating ad ${createdAds.length + 1}/${adSet.ads.length}: ${ad.name}`)

          // Create ad creative
          const creativeId = await this.createAdCreative(
            dto.adAccountId,
            accessToken,
            ad,
            pageId,
          )

          // Create ad
          const adData = {
            name: ad.name,
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: 'PAUSED',
          }

          const adResponse = await axios.post(
            `${this.baseUrl}/act_${dto.adAccountId}/ads`,
            adData,
            {
              params: { access_token: accessToken },
            },
          )

          const adId = adResponse.data.id
          this.logger.log(`Ad created: ${adId}`)
          createdAds.push({ ...ad, metaAdId: adId, creativeId })
        }
      }

      // 4. Save launch to database (simplified for now)
      // const launch = await this.prisma.launch.create({
      //   data: {
      //     blueprintId: null,
      //     status: 'created',
      //     externalCampaignId: campaignId,
      //   },
      // })

      // this.logger.log(`Launch saved to database: ${launch.id}`)

      return {
        success: true,
        launchId: 'temp-id',
        campaignId,
        stats: {
          campaign: 1,
          adSets: createdAdSets.length,
          ads: createdAds.length,
        },
        message: `Successfully created campaign with ${createdAdSets.length} ad sets and ${createdAds.length} ads`,
      }
    } catch (error: any) {
      this.logger.error(`Failed to create bulk launch: ${error.message}`, error.stack)

      // Extract Meta error details if available
      const metaError = error.response?.data?.error
      throw new BadRequestException(
        metaError
          ? `Meta API Error: ${metaError.message} (Code: ${metaError.code})`
          : `Failed to create campaign: ${error.message}`
      )
    }
  }

  /**
   * Get launch status
   */
  async getLaunchStatus(launchId: string) {
    const launch = await this.prisma.launch.findUnique({
      where: { id: launchId },
    })

    if (!launch) {
      throw new BadRequestException('Launch not found')
    }

    return {
      id: launch.id,
      status: launch.status,
      campaignId: launch.externalCampaignId,
      createdAt: launch.createdAt,
    }
  }

  /**
   * Get all launches for a user
   */
  async getUserLaunches(_userId: string) {
    // For now, return all launches
    // In production, filter by user through client relationship
    const launches = await this.prisma.launch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return launches.map(launch => ({
      id: launch.id,
      status: launch.status,
      campaignId: launch.externalCampaignId,
      createdAt: launch.createdAt,
    }))
  }
}
