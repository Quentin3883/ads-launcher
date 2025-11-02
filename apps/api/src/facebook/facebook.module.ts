import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import {
  FacebookAuthController,
  FacebookCampaignsController,
  FacebookInsightsController,
  FacebookAdminController,
  FacebookDebugController,
} from './controllers'
import { FacebookMediaController } from './controllers/facebook-media.controller'
import { FacebookService } from './facebook.service'
import { FacebookApiClient } from './services/facebook-api-client.service'
import { FacebookStrategy } from './strategies/facebook.strategy'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'facebook' }), PrismaModule],
  controllers: [
    FacebookAuthController,
    FacebookCampaignsController,
    FacebookInsightsController,
    FacebookAdminController,
    FacebookDebugController,
    FacebookMediaController,
  ],
  providers: [FacebookService, FacebookApiClient, FacebookStrategy],
  exports: [FacebookService, FacebookApiClient],
})
export class FacebookModule {}
