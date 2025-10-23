import { Injectable } from '@nestjs/common'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { blueprintRouter } from './routers/blueprint.router'
import { PrismaService } from '../prisma/prisma.service'

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
  constructor(private readonly prisma: PrismaService) {}

  appRouter = router({
    blueprint: blueprintRouter(this.prisma),
    health: publicProcedure.query(() => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    }),
  })
}

export type AppRouter = TrpcRouter['appRouter']
