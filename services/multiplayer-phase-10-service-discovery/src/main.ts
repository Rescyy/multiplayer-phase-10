import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json()); 
  app.listen(3001);

  const grpcApp = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: 'servicediscovery',
        protoPath: join(__dirname, '../proto/servicediscovery.proto'),
        url: 'localhost:5000',
        // url: 'service-discovery:5000',
      },
    },
  );
  grpcApp.listen();
}

bootstrap();
