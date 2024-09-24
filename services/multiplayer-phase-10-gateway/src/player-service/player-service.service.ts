import { Injectable } from '@nestjs/common';
import { ServiceType } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';
import { ServiceDiscoveryService } from 'src/service-discovery/service-discovery.service';

@Injectable()
export class PlayerServiceService {
    private playerServiceInstances: ServiceInstanceLoaded[];

    constructor (private readonly serviceDiscoveryService: ServiceDiscoveryService) {
        const playerServiceInstances = this.serviceDiscoveryService.serviceMap[ServiceType.PLAYER_SERVICE];
        console.log(this.serviceDiscoveryService.serviceMap);
    
        this.playerServiceInstances = [];
        for (let i = 0; i < playerServiceInstances.length; i++) {
            this.playerServiceInstances.push(new ServiceInstanceLoaded(playerServiceInstances[i].id, ServiceType.PLAYER_SERVICE, playerServiceInstances[i].url));
        }
    }

    updatePlayerServiceInstances() {
        const playerServiceInstances = this.serviceDiscoveryService.serviceMap[ServiceType.PLAYER_SERVICE];
        for (const playerServiceInstance of playerServiceInstances) {
            const existingPlayerServiceInstance = this.playerServiceInstances.find(instance => instance.id === playerServiceInstance.id);
            if (existingPlayerServiceInstance) {
                continue;
            } else {
                this.playerServiceInstances.push(new ServiceInstanceLoaded(playerServiceInstance.id, ServiceType.PLAYER_SERVICE, playerServiceInstance.url));
            }
        }
    }

    selectPlayerServiceInstance(): ServiceInstanceLoaded {
        this.updatePlayerServiceInstances();
        let minLoad = Number.MAX_VALUE;
        let mostFreePlayerServiceInstanceBeLike = null;
        for (const playerServiceInstance of this.playerServiceInstances) {
            if (playerServiceInstance.load < minLoad && !playerServiceInstance.isAtMaxLoad()) {
                minLoad = playerServiceInstance.load;
                mostFreePlayerServiceInstanceBeLike = playerServiceInstance;
            }
        }
        return mostFreePlayerServiceInstanceBeLike;
    }
    
}
