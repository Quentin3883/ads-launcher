import { Module } from '@nestjs/common'
import { TrpcRouter } from './trpc.router'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [TrpcRouter],
})
export class TrpcModule {}
