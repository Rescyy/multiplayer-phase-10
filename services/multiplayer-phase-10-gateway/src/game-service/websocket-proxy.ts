import { WebSocketGateway, OnGatewayConnection, MessageBody, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { io } from 'socket.io-client';
import { GameServiceService } from './game-service.service';
import { ServiceInstance } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';

@WebSocketGateway(80, { namespace: 'gamesession-ws', transports: ['websocket'] })
export class ProxyGateway implements OnGatewayConnection, OnGatewayDisconnect {

    // private targetServiceClient: WebSocket;
    private rooms: Map<string, {gameServiceInstance: ServiceInstanceLoaded, clients: Map<string, any>}> = new Map();

    constructor(private readonly gameService: GameServiceService) {
    }

    getRoomCode(client: any): string {
        const authorization = client["handshake"]["headers"]["authorization"];
        const jwt = authorization.split(' ')[1];
        const jwtContent = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
        return jwtContent["sub"]["code"];
    }

    handleDisconnect(client: any) {
        try {
            console.log('Client disconnected: ', client["id"]);
            const code = this.getRoomCode(client);
            const room = this.rooms.get(code);
            if (room !== undefined) {
                room.gameServiceInstance.decrementLoad();
                room.clients.get(client["id"]).close();
                room.clients.delete(client["id"]);
                if (room.clients.size === 0) {
                    this.rooms.delete(code);
                }
            }
        } finally {

        }
    }

    handleConnection(client: any) {
        try {

            console.log('Client connected: ', client["id"]);
    
            const code = this.getRoomCode(client);
    
            var gameServiceInstance;
            var targetServiceSocket;

            if (this.rooms.has(code)) {
                gameServiceInstance = this.rooms.get(code).gameServiceInstance;
            } else {
                const gameServiceInstances = this.gameService.sortedByLoadServiceInstances();
                if (gameServiceInstances.length === 0) {
                    console.log("No game service instances available");
                    return;
                }
                const retries = 1;
                for (let i = 0; i < retries; i++) {
                    for (const serviceInstance of gameServiceInstances) {
                        try {
                            const url = serviceInstance.url;
                            targetServiceSocket = io(`${url}/gamesession-ws`, {
                                extraHeaders: {
                                    Authorization: client["handshake"]["headers"]["authorization"]
                                }
                            });
                            if (targetServiceSocket === undefined) {
                                continue;
                            }
                            gameServiceInstance = serviceInstance;
                            break;
                        } catch {

                        } finally {

                        }
                    }
                    if (gameServiceInstance !== undefined) {
                        break;
                    } else {
                        console.log("Multiple reroutes attempted for WebSocketConnection.");
                    }
                }
                this.rooms.set(code, {gameServiceInstance: gameServiceInstance, clients: new Map()});
            }
            gameServiceInstance.incrementLoad();

            this.rooms.get(code).clients.set(client["id"], targetServiceSocket);
    
            targetServiceSocket.on('message', (message) => {
                client.send(message);
            },);
        } finally {

        }
    }

    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: any) {
        try {
            const code = this.getRoomCode(client);
            this.rooms.get(code).clients.get(client["id"]).send(data);
        } finally {
            
        }
    }
}
