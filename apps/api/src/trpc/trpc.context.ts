import * as trpcExpress from '@trpc/server/adapters/express'

export const createTRPCContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return { req, res }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
