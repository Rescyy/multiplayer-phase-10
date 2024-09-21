import { Body, Controller, Get, HttpCode, Ip, Param, Post, Req } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';

@Controller('services')
export class RegistryController {
    constructor(private readonly registryService: RegistryService) {}

    @HttpCode(200)
    @Post('register')
    registerService(@Body() body: Object): void {
        this.registryService.registerService(body);
    }

    @Get(':serviceType')
    getServices(@Param('serviceType') serviceType: ServiceType): ServiceInstance[] {
        return this.registryService.getServices(serviceType);
    }
}
