export enum ServiceType {
    GATEWAY = 'gateway',
    GAME_SERVICE = 'game-service',
    PLAYER_SERVICE = 'player-service',
}

export class ServiceInstance {
        
    public errors: {message: string, time: number}[] = [];

    constructor(
        public readonly id: string,
        public readonly type: ServiceType,
        public readonly url: string,
        public readonly healthcheckPeriod: number,
        
    ) {}

    toString(): string {
        return `ServiceInstance(id=${this.id}, type=${this.type}, url=${this.url})`;
    }
}
