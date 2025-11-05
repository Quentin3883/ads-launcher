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
   * GET /facebook/targeting/geo/search?userId=xxx&q=paris&types=city,region
   */
  @Get('geo/search')
  async searchGeoLocations(
    @Query('userId') userId: string,
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('country_code') countryCode?: string,
    @Query('region_id') regionId?: string,
  ) {
    try {
      if (!userId || !query) {
        throw new HttpException('Missing required parameters: userId, q', HttpStatus.BAD_REQUEST)
      }

      // Get user's Facebook token
      const token = await this.prisma.facebookToken.findFirst({
        where: { userId },
      })

      if (!token) {
        throw new HttpException('Facebook token not found for user', HttpStatus.NOT_FOUND)
      }

      // Parse location types with proper type safety
      const validLocationTypes = ['country', 'region', 'city', 'zip', 'country_group', 'geo_market', 'electoral_district'] as const
      type LocationType = (typeof validLocationTypes)[number]

      const defaultTypes: LocationType[] = ['country', 'region', 'city']
      const locationTypes: LocationType[] = types
        ? types.split(',').filter((t): t is LocationType => validLocationTypes.includes(t as any))
        : defaultTypes

      // Search geo locations
      const results = await this.facebookService.searchGeoLocations(
        token.accessToken,
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
   * GET /facebook/targeting/interests/search?userId=xxx&q=fitness&limit=25
   */
  @Get('interests/search')
  async searchInterests(
    @Query('userId') userId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    try {
      if (!userId || !query) {
        throw new HttpException('Missing required parameters: userId, q', HttpStatus.BAD_REQUEST)
      }

      // Get user's Facebook token
      const token = await this.prisma.facebookToken.findFirst({
        where: { userId },
      })

      if (!token) {
        throw new HttpException('Facebook token not found for user', HttpStatus.NOT_FOUND)
      }

      // Search interests
      const results = await this.facebookService.searchInterests(
        token.accessToken,
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
