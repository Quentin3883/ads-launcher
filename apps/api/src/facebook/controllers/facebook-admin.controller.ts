import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common'
import { FacebookService } from '../facebook.service'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Handles Facebook admin operations (linking ad accounts, etc.)
 */
@Controller('facebook/admin')
export class FacebookAdminController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get user's ad accounts from Facebook
   */
  @Get('accounts/:userId')
  async getAdAccounts(@Param('userId') userId: string) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    return token.adAccounts
  }

  /**
   * Get available ad accounts from Facebook API (not saved yet)
   */
  @Get('available-accounts/:userId')
  async getAvailableAccounts(@Param('userId') userId: string) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    // Fetch from Facebook API
    const fbAccounts = await this.facebookService.fetchAdAccounts(token.accessToken)

    // Get already saved accounts
    const savedAccounts = token.adAccounts.map(acc => acc.facebookId)

    // Return all accounts with selection status
    return fbAccounts.map((account: any) => ({
      id: account.id,
      name: account.name,
      accountStatus: String(account.account_status),
      currency: account.currency,
      timezone: account.timezone_name,
      businessName: account.business?.name,
      businessId: account.business?.id,
      isSelected: savedAccounts.includes(account.id),
    }))
  }

  /**
   * Save selected ad accounts
   */
  @Post('save-accounts/:userId')
  async saveSelectedAccounts(
    @Param('userId') userId: string,
    @Body() body: { accountIds: string[] },
  ) {
    const token = await this.facebookService.getToken(userId)

    if (!token) {
      throw new BadRequestException('No Facebook account connected')
    }

    // Fetch all accounts from Facebook
    const fbAccounts = await this.facebookService.fetchAdAccounts(token.accessToken)

    // Filter only selected accounts
    const selectedAccounts = fbAccounts.filter((acc: any) =>
      body.accountIds.includes(acc.id)
    )

    // Save to database
    await this.facebookService.saveAdAccounts(token.id, selectedAccounts)

    return { success: true, count: selectedAccounts.length }
  }

  /**
   * Delete a Facebook ad account
   */
  @Delete('ad-accounts/:adAccountId')
  async deleteAdAccount(@Param('adAccountId') adAccountId: string) {
    try {
      await this.prisma.facebookAdAccount.delete({
        where: { id: adAccountId },
      })

      return { success: true }
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Link a Facebook ad account to a client
   */
  @Post('ad-accounts/:adAccountId/link-client')
  async linkAdAccountToClient(
    @Param('adAccountId') adAccountId: string,
    @Body() body: { clientId: string | null; userId?: string },
  ) {
    try {
      // Find the Facebook ad account
      const facebookAdAccount = await this.prisma.facebookAdAccount.findUnique({
        where: { id: adAccountId },
      })

      if (!facebookAdAccount) {
        throw new BadRequestException('Ad account not found')
      }

      // Update the ad account to link it to the client
      const updated = await this.prisma.facebookAdAccount.update({
        where: { id: adAccountId },
        data: {
          clientId: body.clientId,
        },
        include: {
          client: true,
        },
      })

      return {
        success: true,
        adAccount: updated,
      }
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }
}
