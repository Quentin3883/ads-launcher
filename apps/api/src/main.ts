import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { TrpcRouter } from './trpc/trpc.router'
import * as trpcExpress from '@trpc/server/adapters/express'
import { createTRPCContext } from './trpc/trpc.router'
import { getEnv } from '@launcher-ads/sdk'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { json, urlencoded } from 'express'

async function bootstrap() {
  const env = getEnv()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Disable default body parser to configure manually
  })

  // Configure body parser with higher limits for video/image uploads
  app.use(json({ limit: '500mb' }))
  app.use(urlencoded({ limit: '500mb', extended: true }))

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  })

  // Get tRPC router
  const trpc = app.get(TrpcRouter)

  // Set up tRPC middleware
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpc.appRouter,
      createContext: createTRPCContext,
    })
  )

  await app.listen(env.API_PORT, env.API_HOST)

  console.log(`🚀 API running on http://${env.API_HOST}:${env.API_PORT}`)
  console.log(
    `📡 tRPC endpoint: http://${env.API_HOST}:${env.API_PORT}/trpc`
  )
}

bootstrap()
