import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('facebook/media')
export class FacebookMediaController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Upload a video file to Facebook
   * POST /facebook/media/upload-video/:adAccountId
   */
  @Post('upload-video/:adAccountId')
  async uploadVideo(
    @Param('adAccountId') adAccountId: string,
    @Body('videoData') videoData: string,
  ) {
    try {
      // Get ad account with token
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: {
          token: true,
        },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      // Upload video and return video ID + thumbnail
      const result = await this.facebookService.uploadVideo(
        adAccount.token.accessToken,
        adAccount.facebookId,
        videoData,
      )

      return {
        videoId: result.videoId,
        thumbnailUrl: result.thumbnailUrl,
        success: true,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to upload video',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Upload an image file to Facebook
   * POST /facebook/media/upload-image/:adAccountId
   */
  @Post('upload-image/:adAccountId')
  async uploadImage(
    @Param('adAccountId') adAccountId: string,
    @Body('imageData') imageData: string,
  ) {
    try {
      // Get ad account with token
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: {
          token: true,
        },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      // Upload image and return hash
      const imageHash = await this.facebookService.uploadImage(
        adAccount.token.accessToken,
        adAccount.facebookId,
        imageData,
      )

      return {
        imageHash,
        success: true,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to upload image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Get images from Meta Media Library
   * GET /facebook/media/library/images/:adAccountId
   */
  @Get('library/images/:adAccountId')
  async getLibraryImages(
    @Param('adAccountId') adAccountId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: {
          token: true,
        },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      const images = await this.facebookService.getAdImages(
        adAccount.token.accessToken,
        adAccount.facebookId,
        limit ? parseInt(limit) : 50,
      )

      return {
        images,
        success: true,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Get videos from Meta Media Library
   * GET /facebook/media/library/videos/:adAccountId
   */
  @Get('library/videos/:adAccountId')
  async getLibraryVideos(
    @Param('adAccountId') adAccountId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const adAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
        include: {
          token: true,
        },
      })

      if (!adAccount) {
        throw new HttpException('Ad account not found', HttpStatus.NOT_FOUND)
      }

      const videos = await this.facebookService.getAdVideos(
        adAccount.token.accessToken,
        adAccount.facebookId,
        limit ? parseInt(limit) : 50,
      )

      return {
        videos,
        success: true,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch videos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

}
