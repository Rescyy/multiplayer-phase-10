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
        // await this.httpWrapper.post('http://localhost:3001/services', {
        await this.httpWrapper.post('http://service-discovery:3001/services', {
            "service-type": ServiceType.GATEWAY,
            "port": 3000,
        });
        
        await this.getServiceInstances();
        setInterval(() => {
            this.getServiceInstances();
        }, 15000);
    }

    async getServiceInstances() {
        try {
            const result = await this.grpcClientService.getServiceInstances();
            const services = result.services;
            this.serviceMap = {};
            for (var i = 0; i < 3; i++) {
                this.serviceMap[i] = [];
            }
            for (var i = 0; i < services.length; i++) {
                const service = services[i];
                const { id, type, url } = service;
                this.serviceMap[type].push({ id, url });
            }
            // console.log(this.serviceMap);
        } catch (error) {
            console.error('Error occurred while fetching services via grpc:', error);
        }
    }
}
