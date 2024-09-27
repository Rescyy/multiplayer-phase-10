import { Injectable } from '@nestjs/common';
import { ServiceType } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';
import { ServiceDiscoveryService } from 'src/service-discovery/service-discovery.service';

@Injectable()
export class GameServiceService {
    private gameServiceInstances: ServiceInstanceLoaded[];

    constructor (private readonly serviceDiscoveryService: ServiceDiscoveryService) {
        const gameServiceInstances = this.serviceDiscoveryService.serviceMap[ServiceType.GAME_SERVICE];
        console.log(this.serviceDiscoveryService.serviceMap);
    
        this.gameServiceInstances = [];
        for (let i = 0; i < gameServiceInstances.length; i++) {
            this.gameServiceInstances.push(new ServiceInstanceLoaded(gameServiceInstances[i].id, ServiceType.GAME_SERVICE, gameServiceInstances[i].url));
        }
    }

    updateGameServiceInstances() {
        const gameServiceInstances = this.serviceDiscoveryService.serviceMap[ServiceType.GAME_SERVICE];
        for (const gameServiceInstance of gameServiceInstances) {
            const existingGameServiceInstance = this.gameServiceInstances.find(instance => instance.id === gameServiceInstance.id);
            if (existingGameServiceInstance) {
                continue;
            } else {
                this.gameServiceInstances.push(new ServiceInstanceLoaded(gameServiceInstance.id, ServiceType.GAME_SERVICE, gameServiceInstance.url));
            }
        }
        this.gameServiceInstances = this.gameServiceInstances.filter(instance => gameServiceInstances.find(gameServiceInstance => gameServiceInstance.id === instance.id));
    }

    selectGameServiceInstance(): ServiceInstanceLoaded {
        this.updateGameServiceInstances();
        let minLoad = Number.MAX_VALUE;
        let mostFreeGameServiceInstanceBeLike = null;
        for (const gameServiceInstance of this.gameServiceInstances) {
            if (gameServiceInstance.load < minLoad && !gameServiceInstance.isAtMaxLoad()) {
                minLoad = gameServiceInstance.load;
                mostFreeGameServiceInstanceBeLike = gameServiceInstance;
            }
        }
        return mostFreeGameServiceInstanceBeLike;
    }
    
}
