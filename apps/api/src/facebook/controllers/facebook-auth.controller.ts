import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { FacebookAuthGuard } from '../guards/facebook-auth.guard'
import { PrismaService } from '../../prisma/prisma.service'
import { Response } from 'express'

/**
 * Handles Facebook OAuth authentication flow
 */
@Controller('facebook/auth')
export class FacebookAuthController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Initiate Facebook OAuth
   */
  @Get()
  @UseGuards(FacebookAuthGuard)
  async auth() {
    // Guard redirects to Facebook
  }

  /**
   * Facebook OAuth callback
   */
  @Get('callback')
  @UseGuards(FacebookAuthGuard)
  async authCallback(@Req() req: any, @Res() res: Response) {
    const { email, name, accessToken } = req.user

    try {
      // Find or create user
      let user = await this.prisma.user.findUnique({ where: { email } })

      if (!user) {
        user = await this.prisma.user.create({
          data: { email, name },
        })
      }

      // Save Facebook token (default: 60 days = 5184000 seconds)
      const expiresIn = 5184000
      await this.facebookService.saveToken(user.id, accessToken, expiresIn)

      // Redirect to integrations page with auth success
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?auth=success&userId=${user.id}`)
    } catch (error) {
      console.error('OAuth callback error:', error)
      return res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`)
    }
  }
}
