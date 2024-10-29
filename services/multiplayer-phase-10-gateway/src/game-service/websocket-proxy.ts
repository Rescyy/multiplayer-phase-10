import { WebSocketGateway, OnGatewayConnection, MessageBody, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { io } from 'socket.io-client';
import { GameServiceService } from './game-service.service';
import { ServiceInstance } from 'src/service-classes/service_instance';
import { ServiceInstanceLoaded } from 'src/service-classes/service_instance_loaded';

@WebSocketGateway(80, { namespace: 'gamesession-ws', transports: ['websocket'] })
export class ProxyGateway implements OnGatewayConnection, OnGatewayDisconnect {

    // private targetServiceClient: WebSocket;
    private connectionPairMap: Map<string, {gameServiceInstance: ServiceInstanceLoaded, clients: Map<string, any>}> = new Map();

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
            this.connectionPairMap.get(code).gameServiceInstance.decrementLoad();
            this.connectionPairMap.get(code).clients.get(client["id"]).close();
            this.connectionPairMap.get(code).clients.delete(client["id"]);
            if (this.connectionPairMap.get(code).clients.size === 0) {
                this.connectionPairMap.delete(code);
            }
        } finally {

        }
    }

    handleConnection(client: any) {
        try {

            console.log('Client connected: ', client["id"]);
    
            const code = this.getRoomCode(client);
    
            var gameServiceInstance;
    
            if (this.connectionPairMap.has(code)) {
                gameServiceInstance = this.connectionPairMap.get(code).gameServiceInstance;
            } else {
                gameServiceInstance = this.gameService.selectGameServiceInstance();
                if (gameServiceInstance === null) {
                    console.log("No game service instances available");
                    return;
                }
                this.connectionPairMap.set(code, {gameServiceInstance: gameServiceInstance, clients: new Map()});
            }
            gameServiceInstance.incrementLoad();
    
            const url = gameServiceInstance.url;
            
            const targetServiceSocket = io(`${url}/gamesession-ws`, {
                extraHeaders: {
                    Authorization: client["handshake"]["headers"]["authorization"]
                }
            }
            );
    
            this.connectionPairMap.get(code).clients.set(client["id"], targetServiceSocket);
    
            targetServiceSocket.on('message', (response) => {
                client.send(response);
            },);
        } finally {

        }
    }

    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: any) {
        try {
            const code = this.getRoomCode(client);
            this.connectionPairMap.get(code).clients.get(client["id"]).send(data);
        } finally {
            
        }
    }
}
