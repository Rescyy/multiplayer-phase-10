import { Injectable } from '@nestjs/common';
import { GrpcClientService } from 'src/grpc-client/grpc-client.service';
import { HttpWrapper } from 'src/http/http.service';
import { ServiceType } from 'src/service-classes/service_instance';

@Injectable()
export class ServiceDiscoveryService {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly grpcClientService: GrpcClientService) {
        this.initServiceDiscovery();
    }

    public serviceMap: {[key: number]: {id: string, url: string}[]} = {
        0: [],
        1: [],
        2: [],
    };

    async initServiceDiscovery() {
        await this.httpWrapper.post('http://localhost:3001/services', {
            "service-type": ServiceType.GATEWAY,
            "port": 3000,
        });
        
        await this.getServiceInstances();
        setInterval(() => {
            this.getServiceInstances();
        }, 15000);
    }

    async getServiceInstances(): Promise<Object> {
        const result = await this.grpcClientService.getServiceInstances() as {"services": { [key: number]: {id: string, type: ServiceType, url: string} }};
        const services = result.services;
        this.serviceMap = {};
        for (var i = 0; i < 3; i++) {
            this.serviceMap[i] = [];
        }
        for (const key in services) {
            const service = services[key];
            const { id, type, url } = service;
            this.serviceMap[type].push({ id, url });
        }
        console.log(this.serviceMap);
        return this.serviceMap;
    }
}
