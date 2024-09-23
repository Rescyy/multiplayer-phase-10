import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';
import axios from 'axios';
import { timeStamp } from 'console';

@Injectable()
export class RegistryService {
    private registry: Map<ServiceType, ServiceInstance[]>;

    constructor() {
        this.registry = new Map();
        Object.keys(ServiceType).forEach((key) => {
            this.registry.set(ServiceType[key], []);
        });
        console.log(this.registry);
    }

    registerService(body: Object, ip: string): Object {

        const serviceType = body['service-type'] as ServiceType;
        const port = body['port'] as number;
        var healthcheckPeriod = 5;

        const healthcheckParams = body['healthcheck-params'];
        if (healthcheckParams !== undefined) {
            const period = healthcheckParams['period'];
            if (period !== undefined) {
                healthcheckPeriod = period as number;
                healthcheckPeriod = healthcheckPeriod < 5 ? 5 : healthcheckPeriod;
                healthcheckPeriod = healthcheckPeriod > 60 ? 60 : healthcheckPeriod;
            }
        }

        if (!Object.values(ServiceType).includes(serviceType)) {
            throw new BadRequestException(`Invalid service type: ${serviceType}`);
        }

        const serviceInstance = new ServiceInstance(randomUUID(), serviceType, `http://[${ip}]:${port}`, healthcheckPeriod);
        
        this.registry.get(serviceType).push(serviceInstance);

        const timeout = healthcheckPeriod * 1000;
        const tripTime = timeout * 5.5;

        // Spawn a thread for health check
        setInterval(async () => {
            // console.log(`Health checking\nService Type:${serviceType}\nID:${serviceInstance.id}\nURL:${serviceInstance.url}}`);
            try {
                const response = await axios.get(`${serviceInstance.url}/ping`, { timeout: timeout });
                if (response.status === 200 && response.data === 'pong') {
                    // console.log(`Health check passed for ${serviceInstance.id}`);
                    serviceInstance.errors = [];
                } else {
                    throw new Error("Health check timeout reached.");
                }
            } catch (error) {
                const errorLog = {message: `${serviceInstance.id} ${error.message}`, time: Date.now()};
                console.log(errorLog);
                serviceInstance.errors.push(errorLog);
                
                while (serviceInstance.errors[0].time < Date.now() - tripTime) {
                    serviceInstance.errors.shift();
                }
                
                if (serviceInstance.errors.length == 3) {
                    console.log("Health check failed for " + serviceInstance.id + "Errors: " + serviceInstance.errors);
                }
                if (serviceInstance.errors.length > 5) {
                    console.log(`Deregistering ${serviceInstance.id} due to health check failure.`);
                    this.registry.set(serviceType, this.registry.get(serviceType).filter((instance) => instance.id !== serviceInstance.id));
                }
            }
        }, healthcheckPeriod * 1000);

        return {
            id: serviceInstance.id,
            url: serviceInstance.url,
        };

    }

    getServices(serviceType: ServiceType): ServiceInstance[] {
        return this.registry.get(serviceType);
    }

    getAllServices(): Map<ServiceType, ServiceInstance[]> {
        return this.registry;
    }
}