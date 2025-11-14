import { Injectable } from '@nestjs/common'
import { blueprintRouter } from './routers/blueprint.router'
import { launchRouter } from './routers/launch.router'
import { facebookCampaignsRouter } from './routers/facebook-campaigns.router'
import { PrismaService } from '../prisma/prisma.service'
import { FacebookService } from '../facebook/facebook.service'
import { router, publicProcedure } from './trpc'

@Injectable()
export class TrpcRouter {
  appRouter: ReturnType<typeof router>

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookService: FacebookService,
  ) {
    this.appRouter = router({
      blueprint: blueprintRouter(this.prisma),
      launch: launchRouter(this.prisma),
      facebookCampaigns: facebookCampaignsRouter(this.prisma, this.facebookService),
      health: publicProcedure.query(() => {
        return { status: 'ok', timestamp: new Date().toISOString() }
      }),
    })
  }
}

export type AppRouter = TrpcRouter['appRouter']
