import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ServiceRegistry } from 'src/service-classes/service_registry';

interface ServiceDiscovery {
    GetServiceInstances(data: {}): Observable<ServiceRegistry>;
}

@Injectable()
export class GrpcClientService implements OnModuleInit {
  private serviceDiscovery: ServiceDiscovery;

  constructor(@Inject('SERVICE_DISCOVERY_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    // This line creates a gRPC proxy object that can call the actual gRPC methods
    this.serviceDiscovery = this.client.getService<ServiceDiscovery>('ServiceDiscovery');
  }

  async getServiceInstances(): Promise<any> { // Change return type to Promise<any>
    return new Promise((resolve, reject) => {
      this.serviceDiscovery.GetServiceInstances({}).subscribe({
        next: (data) => {
          resolve(data); // Resolve the Promise with the received data
        },
        error: (error) => {
          console.error('Error occurred:', error);
          reject(error); // Reject the Promise with the error
        },
      });
    });
  }
}
