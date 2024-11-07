import { Inject, Injectable, Module } from '@nestjs/common';
import { PingController } from './ping/ping.controller';
import { PingService } from './ping/ping.service';
import { RegistryController } from './registry/registry.controller';
import { RegistryService } from './registry/registry.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { RegistryModule } from './registry/registry.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ClientsModule.register([
      {
        name: 'SERVICE_DISCOVERY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'servicediscovery',  // The package name defined in the proto file
          protoPath: join(__dirname, '../proto/servicediscovery.proto'),
          url: `${process.env.SERVICE_DISCOVERY_ADDR_GRPC}`, // gRPC server URL
        },
      },
    ]),
    RegistryModule,
  ],
  controllers: [PingController, RegistryController],
  providers: [PingService],
})
export class AppModule {}
