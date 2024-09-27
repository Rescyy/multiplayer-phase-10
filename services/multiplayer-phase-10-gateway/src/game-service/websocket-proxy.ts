import { WebSocketGateway, OnGatewayConnection, MessageBody, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { io } from 'socket.io-client';
import { GameServiceService } from './game-service.service';

@WebSocketGateway(80, { namespace: 'gamesession-ws', transports: ['websocket'] })
export class ProxyGateway implements OnGatewayConnection, OnGatewayDisconnect {

    // private targetServiceClient: WebSocket;
    private connectionPairs: Map<WebSocket, WebSocket> = new Map();

    constructor(private readonly gameService: GameServiceService) {
    }
    handleDisconnect(client: any) {
        console.log('Client disconnected');
        this.connectionPairs[client["id"]].close();
        this.connectionPairs.delete(client["id"]);
    }

    handleConnection(client: any) {
        console.log('Client connected');

        // Extract headers from the client's request
        // const clientHeaders = req.headers;
        // console.log("client", client["handshake"]["headers"]["authorization"]);

        const gameServiceInstance = this.gameService.selectGameServiceInstance();
        if (gameServiceInstance === null) {
            console.log("No game service instances available");
            client.close();
        }
        const url = gameServiceInstance.url;

        // Connect to the target service with the client's headers
        const targetServiceClient = io(`${url}/gamesession-ws`, {
            extraHeaders: {
                Authorization: client["handshake"]["headers"]["authorization"]
            }
        }
        );

        this.connectionPairs[client["id"]] = targetServiceClient;
        // Forward responses from the target service to the original client
        targetServiceClient.on('message', (response) => {
            client.send(response);
        },);
    }

    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: any) {
        this.connectionPairs[client["id"]].send(data);
    }
}
