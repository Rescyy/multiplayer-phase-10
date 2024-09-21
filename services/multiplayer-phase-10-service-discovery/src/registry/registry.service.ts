import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';

@Injectable()
export class RegistryService {
    private registry: Map<ServiceType, Array<ServiceInstance>>;

    constructor() {
        this.registry = new Map();
        Object.keys(ServiceType).forEach((key) => {
            this.registry.set(ServiceType[key], []);
        });
        console.log(this.registry);
    }

    registerService(body: Object): void {

        const serviceType = body['serviceType'] as ServiceType;
        const port = body['port'] as number;

        if (!Object.values(ServiceType).includes(serviceType)) {
            throw new BadRequestException(`Invalid service type: ${serviceType}`);
        }

        const serviceInstance = new ServiceInstance(randomUUID(), serviceType, `localhost:${port}`);
        
        this.registry.get(serviceType).push(serviceInstance);
        console.log(this.registry);
       
    }

    getServices(serviceType: ServiceType): ServiceInstance[] {
        return this.registry.get(serviceType);
    }
}