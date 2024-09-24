import { Controller, Get } from '@nestjs/common';
import { ServiceDiscoveryService } from './service-discovery.service';

@Controller('services')
export class ServiceDiscoveryController {
    constructor(private readonly service: ServiceDiscoveryService) {}

    @Get()
    getServiceInstances(): Object {
        return this.service.getServiceInstances();
    }

}
