import { Module } from '@nestjs/common'
import { BulkLaunchesController } from './bulk-launches.controller'
import { BulkLaunchesService } from './bulk-launches.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [BulkLaunchesController],
  providers: [BulkLaunchesService],
  exports: [BulkLaunchesService],
})
export class BulkLaunchesModule {}
