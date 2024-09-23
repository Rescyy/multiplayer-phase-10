import { Body, Controller, Get, HttpCode, Ip, Param, Post, Req } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('services')
export class RegistryController {
    constructor(private readonly registryService: RegistryService) {}

    @HttpCode(200)
    @Post()
    registerService(@Body() body: Object, @Ip() ip: string): Object {
        return this.registryService.registerService(body, ip);
    }

    @Get(':serviceType')
    getServices(@Param('serviceType') serviceType: ServiceType): ServiceInstance[] {
        return this.registryService.getServices(serviceType);
    }

    @Get()
    @GrpcMethod('ServiceDiscovery', 'GetServiceInstances')
    getAllServices(): Map<ServiceType, ServiceInstance[]> {
        const services= this.registryService.getAllServices();
        console.log(services);
        return services;
    }
}
