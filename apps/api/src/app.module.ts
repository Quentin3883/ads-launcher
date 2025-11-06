import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { TrpcModule } from './trpc/trpc.module'
import { FacebookModule } from './facebook/facebook.module'
import { ClientsModule } from './clients/clients.module'
import { LaunchesModule } from './launches/launches.module'
import { BulkLaunchesModule } from './bulk-launches/bulk-launches.module'
import { NamingConventionsModule } from './naming-conventions/naming-conventions.module'

@Module({
  imports: [
    PrismaModule,
    TrpcModule,
    FacebookModule,
    ClientsModule,
    LaunchesModule,
    BulkLaunchesModule,
    NamingConventionsModule,
  ],
})
export class AppModule {}
