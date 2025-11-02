import {
  Controller,
  Get,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Debug guard - only allows requests in development mode
 */
import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common'

@Injectable()
export class DebugModeGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Debug endpoints are only available in development mode')
    }
    return true
  }
}

/**
 * Handles Facebook debug endpoints (dev only)
 */
@Controller('facebook/debug')
@UseGuards(DebugModeGuard)
export class FacebookDebugController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Debug: Get raw campaigns from Facebook API
   */
  @Get('raw-campaigns/:userId/:adAccountId')
  async debugRawCampaigns(
    @Param('userId') userId: string,
    @Param('adAccountId') adAccountId: string,
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook token found')
    }

    const campaigns = await this.facebookService.fetchCampaigns(
      token.accessToken,
      adAccountId,
    )

    return {
      adAccountId,
      campaignsCount: campaigns.length,
      campaigns,
      token: {
        userId: token.userId,
        accessToken: `${token.accessToken.substring(0, 20)}...`,
        adAccountsCount: token.adAccounts.length,
      },
    }
  }

  /**
   * Debug: Get raw insights from Facebook API
   */
  @Get('raw-insights/:userId/:adAccountId')
  async debugRawInsights(
    @Param('userId') userId: string,
    @Param('adAccountId') adAccountId: string,
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook token found')
    }

    const campaigns = await this.facebookService.fetchCampaigns(
      token.accessToken,
      adAccountId,
    )

    if (campaigns.length === 0) {
      return { message: 'No campaigns found', adAccountId }
    }

    const firstCampaign = campaigns[0]
    const insights = await this.facebookService.fetchCampaignInsights(
      token.accessToken,
      firstCampaign.id,
      'last_30d',
    )

    return {
      adAccountId,
      campaignId: firstCampaign.id,
      campaignName: firstCampaign.name,
      insights,
    }
  }

  /**
   * Debug: Get database state
   */
  @Get('db-state/:userId')
  async debugDatabaseState(@Param('userId') userId: string) {
    const token = await this.prisma.facebookToken.findFirst({
      where: { userId },
      include: {
        user: true,
        adAccounts: {
          include: {
            campaigns: {
              include: {
                insights: true,
              },
            },
          },
        },
      },
    })

    return {
      token: token ? {
        userId: token.userId,
        adAccountsCount: token.adAccounts.length,
        createdAt: token.createdAt,
      } : null,
      adAccounts: token ? token.adAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        facebookId: acc.facebookId,
        campaignsCount: acc.campaigns.length,
        campaigns: acc.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          insightsCount: c.insights.length,
        })),
      })) : [],
    }
  }
}
