import { Body, Controller, Get, HttpCode, Ip, Param, Post, Req } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';
import { GrpcMethod } from '@nestjs/microservices';
import axios from 'axios';

@Controller('services')
export class RegistryController {
    constructor(private readonly registryService: RegistryService) {}

    @HttpCode(200)
    @Post()
    registerService(@Body() body: Object, @Ip() ip: string): Object {

        const response = this.registryService.registerService(body, ip);

        return response;
    }

    @Get(':serviceType')
    getServices(@Param('serviceType') serviceType: ServiceType): ServiceInstance[] {
        return this.registryService.getServices(serviceType);
    }

    @Get()
    getAllServices(): Object {
        const services = {"services": this.registryService.getAllServices()};
        console.log(services);
        return services;
    }

    @GrpcMethod('ServiceDiscovery', 'GetServiceInstances')
    getAllServicesGrpc(): Object {
        const services = this.registryService.getAllServices();
        console.log(services);
        return {"services": services};
    }

    @Get('pingeveryservice')
    pingPlayerService() {
        console.log("pinged");
        const response = axios.get(`http://localhost:5000/ping`, { timeout: 5000 });
        return response;
    }
}
