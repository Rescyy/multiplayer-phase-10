import { ServiceType } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';
import { ServiceDiscoveryService } from 'src/service-discovery/service-discovery.service';

export class BaseServiceService {
    private serviceInstances: ServiceInstanceLoaded[];

    constructor (private readonly serviceDiscoveryService: ServiceDiscoveryService, private readonly serviceType: ServiceType) {

        const serviceInstances = this.serviceDiscoveryService.serviceMap[serviceType];
        console.log(this.serviceDiscoveryService.serviceMap);
    
        this.serviceInstances = [];
        for (let i = 0; i < serviceInstances.length; i++) {
            this.serviceInstances.push(new ServiceInstanceLoaded(serviceInstances[i].id, serviceType, serviceInstances[i].url));
        }
    }

    updateServiceInstances() {
        const serviceInstances = this.serviceDiscoveryService.serviceMap[this.serviceType];
        for (const playerServiceInstance of serviceInstances) {
            const existingPlayerServiceInstance = this.serviceInstances.find(instance => instance.id === playerServiceInstance.id);
            if (existingPlayerServiceInstance) {
                continue;
            } else {
                this.serviceInstances.push(new ServiceInstanceLoaded(playerServiceInstance.id, this.serviceType, playerServiceInstance.url));
            }
        }
        this.serviceInstances = this.serviceInstances.filter(instance => serviceInstances.find(playerServiceInstance => playerServiceInstance.id === instance.id));
    }

    selectServiceInstance(): ServiceInstanceLoaded {
        this.updateServiceInstances();
        let minLoad = Number.MAX_VALUE;
        let mostFreePlayerServiceInstance = null;
        for (const playerServiceInstance of this.serviceInstances) {
            if (playerServiceInstance.load < minLoad && !playerServiceInstance.isAtMaxLoad()) {
                minLoad = playerServiceInstance.load;
                mostFreePlayerServiceInstance = playerServiceInstance;
            }
        }
        return mostFreePlayerServiceInstance;
    }

    sortedByLoadServiceInstances(): ServiceInstanceLoaded[] {
        this.updateServiceInstances();
        return this.serviceInstances
        .filter(instance => !instance.isAtMaxLoad())
        .sort((a, b) => a.load - b.load);
    }

    getServiceInstance(id: string): ServiceInstanceLoaded {
        return this.serviceInstances.find(instance => instance.id === id);
    }
}
