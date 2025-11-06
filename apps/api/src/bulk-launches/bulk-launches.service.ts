import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BulkLaunchesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new bulk launch
   */
  async create(data: {
    userId: string
    clientId?: string
    adAccountId: string
    name: string
    mode?: string
    launchMode?: string
    campaign: any
    bulkAudiences: any
    bulkCreatives: any
    matrixConfig: any
    totalAdSets?: number
    totalAds?: number
  }) {
    return this.prisma.bulkLaunch.create({
      data: {
        userId: data.userId,
        clientId: data.clientId,
        adAccountId: data.adAccountId,
        name: data.name,
        mode: data.mode || 'create',
        launchMode: data.launchMode,
        status: 'draft',
        campaign: data.campaign,
        bulkAudiences: data.bulkAudiences,
        bulkCreatives: data.bulkCreatives,
        matrixConfig: data.matrixConfig,
        totalAdSets: data.totalAdSets || 0,
        totalAds: data.totalAds || 0,
      },
      include: {
        client: true,
        adAccount: true,
      },
    })
  }

  /**
   * Find all bulk launches for a user
   */
  async findAll(userId: string, clientId?: string) {
    return this.prisma.bulkLaunch.findMany({
      where: {
        userId,
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        adAccount: {
          select: {
            id: true,
            name: true,
            facebookId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Find one bulk launch by ID
   */
  async findOne(id: string) {
    const launch = await this.prisma.bulkLaunch.findUnique({
      where: { id },
      include: {
        client: true,
        adAccount: true,
      },
    })

    if (!launch) {
      throw new NotFoundException(`Bulk launch with ID ${id} not found`)
    }

    return launch
  }

  /**
   * Update a bulk launch
   */
  async update(id: string, data: any) {
    return this.prisma.bulkLaunch.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        adAccount: true,
      },
    })
  }

  /**
   * Delete a bulk launch
   */
  async delete(id: string) {
    return this.prisma.bulkLaunch.delete({
      where: { id },
    })
  }

  /**
   * Mark launch as successfully created on Facebook
   */
  async markLaunched(
    id: string,
    data: { facebookCampaignId: string; facebookData?: any },
  ) {
    return this.prisma.bulkLaunch.update({
      where: { id },
      data: {
        status: 'active',
        facebookCampaignId: data.facebookCampaignId,
        facebookData: data.facebookData || null,
        launchedAt: new Date(),
      },
    })
  }
}
