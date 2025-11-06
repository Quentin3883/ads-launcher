import { Module } from '@nestjs/common'
import { NamingConventionsController } from './naming-conventions.controller'
import { NamingConventionsService } from './naming-conventions.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [NamingConventionsController],
  providers: [NamingConventionsService],
  exports: [NamingConventionsService],
})
export class NamingConventionsModule {}
