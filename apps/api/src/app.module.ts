import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { TrpcModule } from './trpc/trpc.module'
import { FacebookModule } from './facebook/facebook.module'
import { ClientsModule } from './clients/clients.module'
import { LaunchesModule } from './launches/launches.module'

@Module({
  imports: [PrismaModule, TrpcModule, FacebookModule, ClientsModule, LaunchesModule],
})
export class AppModule {}
