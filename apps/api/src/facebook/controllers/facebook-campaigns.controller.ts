import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'

/**
 * Handles Facebook campaign CRUD operations
 */
@Controller('facebook/campaigns')
export class FacebookCampaignsController {
  constructor(private readonly facebookService: FacebookService) {}

  /**
   * Get campaigns for an ad account
   */
  @Get(':userId/:adAccountId')
  async getCampaigns(
    @Param('userId') userId: string,
    @Param('adAccountId') adAccountId: string,
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    const campaigns = await this.facebookService.fetchCampaigns(
      token.accessToken,
      adAccountId,
    )

    return campaigns
  }

  /**
   * Get full campaign data including all ad sets and ads
   * Used for Edit Mode to pre-fill launcher with existing campaign structure
   */
  @Get(':userId/campaign/:campaignId/full')
  async getCampaignFull(
    @Param('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    const fullData = await this.facebookService.fetchCampaignFull(
      token.accessToken,
      campaignId,
    )

    return fullData
  }

  /**
   * Sync campaigns from Facebook to database
   * Note: Endpoint disabled - use GET to fetch campaigns directly
   */
  @Post(':userId/:adAccountId/sync')
  async syncCampaigns(
    @Param('userId') _userId: string,
    @Param('adAccountId') _adAccountId: string,
  ) {
    // TODO: Implement syncCampaigns method in FacebookService if needed
    throw new BadRequestException('Sync not yet implemented - use GET to fetch campaigns')
  }

  /**
   * Update campaign status (ACTIVE or PAUSED only)
   */
  @Patch(':userId/:campaignId/status')
  async updateCampaignStatus(
    @Param('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() body: { status: 'ACTIVE' | 'PAUSED' },
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    const result = await this.facebookService.updateCampaignStatus(
      token.accessToken,
      campaignId,
      body.status,
    )

    return result
  }

  /**
   * Update campaign budget (daily or lifetime)
   */
  @Patch(':userId/:campaignId/budget')
  async updateCampaignBudget(
    @Param('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() body: { daily_budget?: number; lifetime_budget?: number },
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    const result = await this.facebookService.updateCampaignBudget(
      token.accessToken,
      campaignId,
      body,
    )

    return result
  }
}
