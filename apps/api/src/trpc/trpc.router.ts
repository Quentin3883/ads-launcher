import { Injectable } from '@nestjs/common'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { blueprintRouter } from './routers/blueprint.router'
import { launchRouter } from './routers/launch.router'
import { facebookCampaignsRouter } from './routers/facebook-campaigns.router'
import { PrismaService } from '../prisma/prisma.service'
import { FacebookService } from '../facebook/facebook.service'

export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return { req, res }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

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
