import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { TrpcRouter } from './trpc/trpc.router'
import * as trpcExpress from '@trpc/server/adapters/express'
import { createContext } from './trpc/trpc.router'
import { getEnv } from '@launcher-ads/sdk'

async function bootstrap() {
  const env = getEnv()
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  // Get tRPC router
  const trpc = app.get(TrpcRouter)

  // Set up tRPC middleware
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpc.appRouter,
      createContext,
    })
  )

  await app.listen(env.API_PORT, env.API_HOST)

  console.log(`🚀 API running on http://${env.API_HOST}:${env.API_PORT}`)
  console.log(
    `📡 tRPC endpoint: http://${env.API_HOST}:${env.API_PORT}/trpc`
  )
}

bootstrap()
