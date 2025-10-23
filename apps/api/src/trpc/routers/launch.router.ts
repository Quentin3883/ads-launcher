import { z } from 'zod'
import { PrismaService } from '../../prisma/prisma.service'
import { publicProcedure, router } from '../trpc.router'
import { ProviderFactory } from '../../providers'
import { runLaunch } from '../../launches'
import { Blueprint } from '@launcher-ads/sdk'

export const launchRouter = (prisma: PrismaService) =>
  router({
    /**
     * Lance un blueprint et crée les campagnes
     */
    run: publicProcedure
      .input(
        z.object({
          blueprintId: z.string().uuid(),
          dryRun: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ input }) => {
        // 1. Récupérer le blueprint
        const blueprintRecord = await prisma.blueprint.findUnique({
          where: { id: input.blueprintId },
        })

        if (!blueprintRecord) {
          throw new Error('Blueprint not found')
        }

        // Cast Prisma record to SDK Blueprint type
        const blueprint = blueprintRecord as unknown as Blueprint

        // 2. Créer l'adapter
        const adapter = ProviderFactory.create({
          platform: blueprint.platform.toUpperCase() as 'META',
          dryRun: input.dryRun,
        })

        // 3. Lancer le blueprint
        const result = await runLaunch(blueprint, adapter)

        // 4. Créer le Launch record en DB
        const launchRecord = await prisma.launch.create({
          data: {
            blueprintId: blueprint.id,
            status: result.errors.length > 0 ? 'failed' : 'completed',
            externalCampaignId: result.created.find(
              (e) => e.type === 'campaign'
            )?.externalId,
            startedAt: result.startedAt,
            completedAt: result.completedAt,
            errorMessage:
              result.errors.length > 0
                ? result.errors.map((e) => e.error).join('; ')
                : null,
          },
        })

        return {
          launchId: launchRecord.id,
          result,
        }
      }),

    /**
     * Liste tous les launches
     */
    list: publicProcedure.query(async () => {
      return await prisma.launch.findMany({
        include: {
          blueprint: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

    /**
     * Récupère un launch par ID
     */
    getById: publicProcedure
      .input(z.string().uuid())
      .query(async ({ input }) => {
        const launch = await prisma.launch.findUnique({
          where: { id: input },
          include: {
            blueprint: true,
            leads: true,
          },
        })

        if (!launch) {
          throw new Error('Launch not found')
        }

        return launch
      }),
  })
