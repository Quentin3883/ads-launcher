import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { TrpcModule } from './trpc/trpc.module'

@Module({
  imports: [PrismaModule, TrpcModule],
})
export class AppModule {}
