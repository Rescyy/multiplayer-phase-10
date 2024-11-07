import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json()); 
  app.listen(3001);
  const configService = app.get(ConfigService);
  const serviceDiscoveryAddr = configService.get<string>('SERVICE_DISCOVERY_ADDR_GRPC');

  const grpcApp = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: 'servicediscovery',
        protoPath: join(__dirname, '../proto/servicediscovery.proto'),
        url: serviceDiscoveryAddr,
      },
    },
  );
  grpcApp.listen();
}

bootstrap();
