import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('facebook/targeting')
export class FacebookTargetingController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Search geo locations (countries, regions, cities)
   * GET /facebook/targeting/geo/search?adAccountId=xxx&q=paris&types=city,region
   */
  @Get('geo/search')
  async searchGeoLocations(
    @Query('adAccountId') adAccountId: string,
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('country_code') countryCode?: string,
    @Query('region_id') regionId?: string,
  ) {
    try {
      if (!adAccountId || !query) {
        throw new HttpException('Missing required parameters: adAccountId, q', HttpStatus.BAD_REQUEST)
      }

      // Get ad account with token
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: { token: true },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      // Parse location types
      const locationTypes = types
        ? (types.split(',') as Array<'country' | 'region' | 'city' | 'zip' | 'country_group' | 'geo_market' | 'electoral_district'>)
        : ['country', 'region', 'city']

      // Search geo locations
      const results = await this.facebookService.searchGeoLocations(
        adAccount.token.accessToken,
        {
          q: query,
          location_types: locationTypes,
          ...(countryCode && { country_code: countryCode }),
          ...(regionId && { region_id: parseInt(regionId) }),
        },
      )

      return {
        success: true,
        data: results,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to search geo locations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Search interests for targeting
   * GET /facebook/targeting/interests/search?adAccountId=xxx&q=fitness&limit=25
   */
  @Get('interests/search')
  async searchInterests(
    @Query('adAccountId') adAccountId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    try {
      if (!adAccountId || !query) {
        throw new HttpException('Missing required parameters: adAccountId, q', HttpStatus.BAD_REQUEST)
      }

      // Get ad account with token
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: { token: true },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      // Search interests
      const results = await this.facebookService.searchInterests(
        adAccount.token.accessToken,
        query,
        limit ? parseInt(limit) : 25,
      )

      return {
        success: true,
        data: results,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to search interests',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
