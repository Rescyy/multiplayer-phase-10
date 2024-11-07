import { Injectable } from '@nestjs/common';
import { BaseServiceService } from 'src/base-service/base-service.service';
import { ServiceType } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';
import { ServiceDiscoveryService } from 'src/service-discovery/service-discovery.service';

@Injectable()
export class PlayerServiceService extends BaseServiceService {

    constructor (serviceDiscoveryService: ServiceDiscoveryService) {
        super(serviceDiscoveryService, ServiceType.PLAYER_SERVICE);
    }
    
}
