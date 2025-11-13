import { z } from 'zod'
import { PrismaService } from '../../prisma/prisma.service'
import { FacebookService } from '../../facebook/facebook.service'
import { publicProcedure, router } from '../trpc.router'

/**
 * Facebook campaign launcher router
 * Handles bulk campaign creation from the frontend bulk launcher
 */
export const facebookCampaignsRouter = (
  prisma: PrismaService,
  facebookService: FacebookService,
) =>
  router({
    /**
     * Launch a bulk campaign structure to Facebook
     * Takes data from the bulk launcher store and creates everything via Facebook API
     */
    launchBulkCampaign: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          adAccountId: z.string().uuid(),
          facebookPageId: z.string(),
          facebookPixelId: z.string().optional(),
          instagramAccountId: z.string().optional(),
          campaign: z.object({
            name: z.string(),
            type: z.string(),
            objective: z.string(),
            budgetMode: z.enum(['CBO', 'ABO']),
            budgetType: z.enum(['daily', 'lifetime']),
            budget: z.number().optional(),
            startDate: z.string(),
            endDate: z.string().optional(),
            urlTags: z.string().optional(), // Facebook url_tags for UTM tracking
          }),
          adSets: z.array(
            z.object({
              name: z.string(),
              audience: z.object({
                type: z.string(),
                name: z.string(),
                interests: z.array(z.string()).optional(),
                customAudienceId: z.string().optional(),
              }),
              placements: z.array(z.string()),
              geoLocations: z.object({
                countries: z.array(z.string()),
                regions: z.array(z.string()).optional(),
                cities: z.array(z.string()).optional(),
              }),
              demographics: z.object({
                ageMin: z.number(),
                ageMax: z.number(),
                gender: z.string(),
              }),
              optimizationEvent: z.string(),
              budget: z.number().optional(),
              budgetType: z.enum(['daily', 'lifetime']).optional(),
              ads: z.array(
                z.object({
                  name: z.string(),
                  format: z.string(),
                  creativeUrl: z.string(), // Can be URL, data URL, or Facebook video URL
                  creativeUrlStory: z.string().optional(), // Can be URL, data URL, or Facebook video URL
                  headline: z.string(),
                  primaryText: z.string(),
                  cta: z.string(),
                  destination: z.object({
                    type: z.string(),
                    url: z.string().optional(),
                    formId: z.string().optional(),
                    deeplink: z.string().optional(),
                  }),
                }),
              ),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        return await facebookService.launchBulkCampaign(
          input.userId,
          input.adAccountId,
          {
            campaign: input.campaign,
            adSets: input.adSets,
            facebookPageId: input.facebookPageId,
            facebookPixelId: input.facebookPixelId,
            instagramAccountId: input.instagramAccountId,
          },
        )
      }),

    /**
     * Get launch history for a user
     */
    getLaunchHistory: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          limit: z.number().optional().default(50),
        }),
      )
      .query(async ({ input }) => {
        // Get user's ad accounts
        const token = await prisma.facebookToken.findFirst({
          where: { userId: input.userId },
          include: {
            adAccounts: true,
          },
        })

        if (!token) {
          return []
        }

        const adAccountIds = token.adAccounts.map((acc) => acc.id)

        // Get recent campaigns
        const campaigns = await prisma.facebookCampaign.findMany({
          where: {
            adAccountId: { in: adAccountIds },
          },
          include: {
            adAccount: {
              select: {
                name: true,
                facebookId: true,
              },
            },
            adSets: {
              include: {
                ads: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
        })

        return campaigns.map((campaign) => ({
          id: campaign.id,
          facebookId: campaign.facebookId,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          adAccount: campaign.adAccount,
          adSetsCount: campaign.adSets.length,
          adsCount: campaign.adSets.reduce(
            (sum, adSet) => sum + adSet.ads.length,
            0,
          ),
          createdAt: campaign.createdAt,
          lastSyncedAt: campaign.lastSyncedAt,
        }))
      }),

    /**
     * Update campaign status (activate/pause)
     */
    updateCampaignStatus: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          campaignId: z.string().uuid(),
          status: z.enum(['ACTIVE', 'PAUSED']),
        }),
      )
      .mutation(async ({ input }) => {
        // Get campaign and verify ownership
        const campaign = await prisma.facebookCampaign.findUnique({
          where: { id: input.campaignId },
          include: {
            adAccount: {
              include: {
                token: true,
              },
            },
          },
        })

        if (!campaign) {
          throw new Error('Campaign not found')
        }

        if (campaign.adAccount.token.userId !== input.userId) {
          throw new Error('Unauthorized')
        }

        // Update via Facebook API
        await facebookService.updateCampaignStatus(
          campaign.adAccount.token.accessToken,
          campaign.facebookId,
          input.status,
        )

        // Update in database
        await prisma.facebookCampaign.update({
          where: { id: input.campaignId },
          data: {
            status: input.status,
            lastSyncedAt: new Date(),
          },
        })

        return { success: true }
      }),

    /**
     * Search geo locations via Facebook Targeting API
     */
    searchGeoLocations: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          q: z.string(),
          location_types: z.array(
            z.enum(['country', 'region', 'city', 'zip', 'country_group', 'geo_market', 'electoral_district']),
          ),
          country_code: z.string().optional(),
          region_id: z.number().optional(),
          limit: z.number().optional(),
        }),
      )
      .query(async ({ input }) => {
        const token = await prisma.facebookToken.findFirst({
          where: { userId: input.userId },
        })

        if (!token) {
          throw new Error('No Facebook token found')
        }

        return await facebookService.searchGeoLocations(token.accessToken, {
          q: input.q,
          location_types: input.location_types,
          country_code: input.country_code,
          region_id: input.region_id,
          limit: input.limit,
        })
      }),

    /**
     * Search interests via Facebook Targeting API
     */
    searchInterests: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          q: z.string(),
          limit: z.number().optional(),
        }),
      )
      .query(async ({ input }) => {
        const token = await prisma.facebookToken.findFirst({
          where: { userId: input.userId },
        })

        if (!token) {
          throw new Error('No Facebook token found')
        }

        return await facebookService.searchInterests(
          token.accessToken,
          input.q,
          input.limit,
        )
      }),

    /**
     * Get interest suggestions
     */
    getInterestSuggestions: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          interests: z.array(z.string()),
        }),
      )
      .query(async ({ input }) => {
        const token = await prisma.facebookToken.findFirst({
          where: { userId: input.userId },
        })

        if (!token) {
          throw new Error('No Facebook token found')
        }

        return await facebookService.getInterestSuggestions(
          token.accessToken,
          input.interests,
        )
      }),

    /**
     * Get ad accounts for a client
     */
    getClientAdAccounts: publicProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
        }),
      )
      .query(async ({ input }) => {
        const adAccounts = await prisma.facebookAdAccount.findMany({
          where: {
            clientId: input.clientId,
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
        })

        return adAccounts
      }),

    /**
     * Get Facebook Pages for a user (via ad account token)
     */
    getUserPages: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
        }),
      )
      .query(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        return await facebookService.getUserPages(
          adAccount.token.accessToken,
          adAccount.facebookId,
        )
      }),

    /**
     * Get Lead Forms for a Facebook Page
     */
    getLeadForms: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
          pageId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        // First, get the pages to retrieve the page access token
        const pages = await facebookService.getUserPages(
          adAccount.token.accessToken,
          adAccount.facebookId,
        )

        const selectedPage = pages.find((page: any) => page.id === input.pageId)

        if (!selectedPage || !selectedPage.access_token) {
          throw new Error('Page not found or no access token available')
        }

        // Use the page access token to get lead forms
        return await facebookService.getLeadForms(
          selectedPage.access_token,
          input.pageId,
        )
      }),

    /**
     * Upload a video file to Facebook (pre-upload before campaign launch)
     * This prevents JSON payload size issues when launching with multiple videos
     */
    uploadVideo: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
          videoData: z.string(), // base64 data URL
        }),
      )
      .mutation(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        // Upload video and return video ID
        const videoId = await facebookService.uploadVideo(
          adAccount.token.accessToken,
          adAccount.facebookId,
          input.videoData,
        )

        return {
          videoId,
          success: true,
        }
      }),

    /**
     * Upload an image file to Facebook (pre-upload before campaign launch)
     * This prevents JSON payload size issues when launching with multiple large images
     */
    uploadImage: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
          imageData: z.string(), // base64 data URL
        }),
      )
      .mutation(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        // Upload image and return hash
        const imageHash = await facebookService.uploadImage(
          adAccount.token.accessToken,
          adAccount.facebookId,
          input.imageData,
        )

        return {
          imageHash,
          success: true,
        }
      }),

    /**
     * Get all naming conventions
     */
    getNamingConventions: publicProcedure.query(async () => {
      const conventions = await prisma.namingConvention.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      })

      return conventions
    }),

    /**
     * Get default naming convention
     */
    getDefaultNamingConvention: publicProcedure.query(async () => {
      const convention = await prisma.namingConvention.findFirst({
        where: {
          isDefault: true,
          isActive: true,
        },
      })

      return convention
    }),

    /**
     * Get Pixel Events
     * Retrieves all events tracked by a Facebook Pixel
     */
    getPixelEvents: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
          pixelId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        return await facebookService.getPixelEvents(
          adAccount.token.accessToken,
          input.pixelId,
        )
      }),

    /**
     * Get Custom Conversions
     * Retrieves custom conversions for an ad account
     */
    getCustomConversions: publicProcedure
      .input(
        z.object({
          adAccountId: z.string().uuid(),
        }),
      )
      .query(async ({ input }) => {
        // Get ad account with token
        const adAccount = await prisma.facebookAdAccount.findUnique({
          where: { id: input.adAccountId },
          include: {
            token: true,
          },
        })

        if (!adAccount) {
          throw new Error('Ad account not found')
        }

        return await facebookService.getCustomConversions(
          adAccount.token.accessToken,
          adAccount.facebookId,
        )
      }),
  })
