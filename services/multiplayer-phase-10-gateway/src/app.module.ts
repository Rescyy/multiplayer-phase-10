import { Module } from '@nestjs/common';
import { PingController } from './ping/ping.controller';
import { PingService } from './ping/ping.service';
import { GrpcClientService } from './grpc-client/grpc-client.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ServiceDiscoveryService } from './service-discovery/service-discovery.service';
import { ServiceDiscoveryController } from './service-discovery/service-discovery.controller';
import { PlayerServiceController } from './player-service/player-service.controller';
import { PlayerServiceService } from './player-service/player-service.service';
import { HttpModule } from '@nestjs/axios';
import { HttpWrapper } from './http/http.service';
import { GameServiceController } from './game-service/game-service.controller';
import { GameServiceService } from './game-service/game-service.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SERVICE_DISCOVERY_PACKAGE', // Name for this gRPC client
        transport: Transport.GRPC,
        options: {
          package: 'servicediscovery', // The package name from your .proto file
          protoPath: join(__dirname, '../proto/servicediscovery.proto'), // Path to your .proto file
          url: 'localhost:5000', // gRPC server URL
          // url: 'service-discovery:5000', // gRPC server URL
        },
      },
    ]),
    HttpModule,
  ],
  controllers: [PingController, ServiceDiscoveryController, PlayerServiceController, GameServiceController],
  providers: [PingService, GrpcClientService, ServiceDiscoveryService, PlayerServiceService, HttpWrapper, GameServiceService],
})
export class AppModule {}
