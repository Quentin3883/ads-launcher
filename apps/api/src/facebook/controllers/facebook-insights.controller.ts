import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'

/**
 * Handles Facebook insights and analytics
 */
@Controller('facebook/insights')
export class FacebookInsightsController {
  constructor(private readonly facebookService: FacebookService) {}

  /**
   * Get all campaigns with insights for user (from database)
   */
  @Get('campaigns/:userId')
  async getCampaignsWithInsights(@Param('userId') userId: string) {
    const campaigns = await this.facebookService.getCampaignsWithInsightsFromDB(userId)
    return { campaigns }
  }

  /**
   * Sync campaigns and insights from Facebook to database
   */
  @Post('campaigns/:userId/sync')
  async syncCampaignsInsights(
    @Param('userId') userId: string,
    @Body() body: { datePreset?: string },
  ) {
    try {
      const result = await this.facebookService.syncAllCampaignsWithInsights(
        userId,
        body.datePreset || 'last_30d',
      )
      return result
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Get analytics for a specific client (all their ad accounts)
   */
  @Get('client/:clientId')
  async getClientAnalytics(
    @Param('clientId') clientId: string,
    @Body() body?: { datePreset?: string },
  ) {
    try {
      const analytics = await this.facebookService.getClientAnalyticsByDate(
        clientId,
        body?.datePreset || 'last_30d',
      )
      return analytics
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }
}
