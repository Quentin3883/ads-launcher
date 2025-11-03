import { Module } from '@nestjs/common'
import { TrpcRouter } from './trpc.router'
import { PrismaModule } from '../prisma/prisma.module'
import { FacebookModule } from '../facebook/facebook.module'

@Module({
  imports: [PrismaModule, FacebookModule],
  providers: [TrpcRouter],
})
export class TrpcModule {}
