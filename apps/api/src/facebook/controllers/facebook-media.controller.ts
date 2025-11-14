// @ts-nocheck - NestJS decorator types conflict with Next.js tsconfig when imported cross-project
import {
  Controller,
  Post,
  Get,
  HttpException,
  HttpStatus,
  Sse,
  MessageEvent,
  Param,
  Body,
  Query,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { PrismaService } from '../../prisma/prisma.service'
import { Observable, Subject } from 'rxjs'

// Progress event manager for tracking upload progress
export class UploadProgressManager {
  private static progressStreams = new Map<string, Subject<MessageEvent>>()

  static getOrCreateStream(uploadId: string): Subject<MessageEvent> {
    if (!this.progressStreams.has(uploadId)) {
      this.progressStreams.set(uploadId, new Subject<MessageEvent>())
    }
    return this.progressStreams.get(uploadId)!
  }

  static emitProgress(uploadId: string, data: any) {
    const stream = this.progressStreams.get(uploadId)
    if (stream) {
      stream.next({ data })
    }
  }

  static completeStream(uploadId: string) {
    const stream = this.progressStreams.get(uploadId)
    if (stream) {
      stream.complete()
      this.progressStreams.delete(uploadId)
    }
  }
}

@Controller('facebook/media')
export class FacebookMediaController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * SSE endpoint to stream upload progress
   * GET /facebook/media/upload-progress/:uploadId
   */
  @Sse('upload-progress/:uploadId')
  streamUploadProgress(@Param('uploadId') uploadId: string): Observable<MessageEvent> {
    return UploadProgressManager.getOrCreateStream(uploadId)
  }

  /**
   * Upload a video file to Facebook
   * POST /facebook/media/upload-video/:adAccountId
   */
  @Post('upload-video/:adAccountId')
  async uploadVideo(
    @Param('adAccountId') adAccountId: string,
    @Body() body: { videoData: string; uploadId?: string; fileName?: string },
  ) {
    const { videoData, uploadId, fileName } = body

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
        undefined,
        uploadId,
        fileName,
      )

      return {
        videoId: result.videoId,
        thumbnailUrl: result.thumbnailUrl,
        success: true,
      }
    } catch (error: any) {
      // Emit error to progress stream if uploadId exists
      if (uploadId) {
        UploadProgressManager.emitProgress(uploadId, {
          status: 'error',
          error: error.message,
        })
        UploadProgressManager.completeStream(uploadId)
      }
      throw new HttpException(
        error.message || 'Failed to upload video',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Check video status and wait until ready
   * GET /facebook/media/video-status/:adAccountId/:videoId
   */
  @Get('video-status/:adAccountId/:videoId')
  async checkVideoStatus(
    @Param('adAccountId') adAccountId: string,
    @Param('videoId') videoId: string,
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

      // Wait for video to be ready
      const isReady = await this.facebookService.waitForVideoReady(
        adAccount.token.accessToken,
        videoId,
      )

      if (!isReady) {
        throw new HttpException('Video processing failed or timed out', HttpStatus.REQUEST_TIMEOUT)
      }

      // Fetch thumbnail
      const thumbnailUrl = await this.facebookService.getVideoThumbnail(
        adAccount.token.accessToken,
        videoId,
      )

      return {
        videoId,
        thumbnailUrl,
        ready: true,
        success: true,
      }
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to check video status',
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
    @Body() body: { imageData: string; fileName?: string },
  ) {
    const { imageData, fileName } = body

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

      // Upload image and return hash and id
      const result = await this.facebookService.uploadImage(
        adAccount.token.accessToken,
        adAccount.facebookId,
        imageData,
        fileName,
      )

      return {
        imageHash: result.hash,
        imageId: result.id,
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
