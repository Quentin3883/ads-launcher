import { Injectable } from '@nestjs/common'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { blueprintRouter } from './routers/blueprint.router'
import { launchRouter } from './routers/launch.router'
import { facebookCampaignsRouter } from './routers/facebook-campaigns.router'
import { PrismaService } from '../prisma/prisma.service'
import { FacebookService } from '../facebook/facebook.service'

export const createTRPCContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return { req, res }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create()

// Export with underscore prefix to avoid tRPC reserved name conflicts
export const _router = t.router
export const _publicProcedure = t.procedure

@Injectable()
export class TrpcRouter {
  appRouter: ReturnType<typeof _router>

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookService: FacebookService,
  ) {
    this.appRouter = _router({
      blueprint: blueprintRouter(this.prisma),
      launch: launchRouter(this.prisma),
      facebookCampaigns: facebookCampaignsRouter(this.prisma, this.facebookService),
      health: _publicProcedure.query(() => {
        return { status: 'ok', timestamp: new Date().toISOString() }
      }),
    })
  }
}

export type AppRouter = TrpcRouter['appRouter']
