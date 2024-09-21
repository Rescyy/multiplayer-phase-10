import { Module } from '@nestjs/common';
import { PingController } from './ping/ping.controller';
import { PingService } from './ping/ping.service';
import { RegistryController } from './registry/registry.controller';
import { RegistryService } from './registry/registry.service';
import { ServiceInstance, ServiceType } from './service_instance/service_instance';

@Module({
  imports: [],
  controllers: [PingController, RegistryController],
  providers: [PingService, RegistryService],
})
export class AppModule {}
