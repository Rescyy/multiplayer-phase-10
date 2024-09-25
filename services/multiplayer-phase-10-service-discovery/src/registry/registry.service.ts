import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ServiceInstance, ServiceType } from 'src/service_instance/service_instance';
import axios from 'axios';

@Injectable()
export class RegistryService {
    private registry: ServiceInstance[];

    constructor() {
        this.registry = [];
    }

    registerService(body: Object, ip: string): Object {

        if (ip === "::1") {
            ip = "localhost";
        } else {
            ip = `[${ip}]`;
        }
        if (body['service-type'] === undefined || body['port'] === undefined) {
            throw new BadRequestException("Missing required fields.");
        }
        const port = body['port'] as number;
        const serviceType = body['service-type'] as ServiceType;
        const url = `http://${ip}:${port}`;

        var serviceInstance = this.registry.find((instance) => instance.url === url);
        if (serviceInstance !== undefined) {
            return {
                id: serviceInstance.id,
                url: serviceInstance.url,
            };
        }

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

        serviceInstance = new ServiceInstance(randomUUID(), serviceType, url, healthcheckPeriod);

        console.log("Registering service: " + serviceInstance);
        this.registry.push(serviceInstance);


        const timeout = healthcheckPeriod * 1000;
        const tripTime = timeout * 5.5;

        // Spawn a thread for health check
        const intervalId = setInterval(async () => {
            // console.log(`Health checking\nService Type:${serviceType}\nID:${serviceInstance.id}\nURL:${serviceInstance.url}}`);
            try {
                console.log(`Health checking ${serviceInstance.id}; url: ${serviceInstance.url}`);
                const response = await axios.get(`${serviceInstance.url}/ping`, { timeout: timeout });
                if (response.status === 200 && response.data === 'pong') {
                    // console.log(`Health check passed for ${serviceInstance.id}`);
                    serviceInstance.errors = [];
                } else {
                    throw new Error("Health check timeout reached.");
                }
            } catch (error) {
                const errorLog = {error: `${serviceInstance.id} ${error.message}`, time: Date.now()};
                console.log(errorLog);
                serviceInstance.errors.push(errorLog);
                
                while (serviceInstance.errors[0].time < Date.now() - tripTime) {
                    serviceInstance.errors.shift();
                }
                
                if (serviceInstance.errors.length == 3) {
                    console.log("Health check failed for " + serviceInstance + "\nErrors: " + serviceInstance.errors);
                }
                if (serviceInstance.errors.length > 5) {
                    console.log(`Deregistering ${serviceInstance.id} due to health check failure.`);
                    this.registry = this.registry.filter((instance) => instance.id !== serviceInstance.id);
                    clearInterval(intervalId);
                }
            }
        }, healthcheckPeriod * 1000);

        return {
            id: serviceInstance.id,
            url: serviceInstance.url,
        };

    }

    getServices(serviceType: ServiceType): ServiceInstance[] {
        return this.registry.filter((instance) => instance.type === serviceType);
    }

    getAllServices(): ServiceInstance[] {
        return this.registry;
    }
}