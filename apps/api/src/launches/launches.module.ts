import { Module } from '@nestjs/common'
import { LaunchesController } from './launches.controller'
import { LaunchesService } from './launches.service'
import { PrismaModule } from '../prisma/prisma.module'
import { FacebookModule } from '../facebook/facebook.module'

@Module({
  imports: [PrismaModule, FacebookModule],
  controllers: [LaunchesController],
  providers: [LaunchesService],
  exports: [LaunchesService],
})
export class LaunchesModule {}
