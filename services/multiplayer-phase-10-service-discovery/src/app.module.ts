import { Module } from '@nestjs/common';
import { PingController } from './ping/ping.controller';
import { PingService } from './ping/ping.service';
import { RegistryController } from './registry/registry.controller';
import { RegistryService } from './registry/registry.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SERVICE_DISCOVERY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'servicediscovery',  // The package name defined in the proto file
          protoPath: join(__dirname, '../proto/servicediscovery.proto'),
          url: 'localhost:5000', // gRPC server URL
        },
      },
    ]),
  ],
  controllers: [PingController, RegistryController],
  providers: [PingService, RegistryService],
})
export class AppModule {}
