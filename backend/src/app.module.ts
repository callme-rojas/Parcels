import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ParcelsModule } from './parcels/parcels.module';
import { BusesModule } from './buses/buses.module';
import { ReportsModule } from './reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EtiquetaModule } from './etiqueta/etiqueta.module';
import { UsersModule } from './users/users.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import type { Request } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    AuthModule,
    BusesModule,
    ParcelsModule,
    ReportsModule,
    EtiquetaModule,
    UsersModule,
    SucursalesModule,
  ],
})
export class AppModule {}
