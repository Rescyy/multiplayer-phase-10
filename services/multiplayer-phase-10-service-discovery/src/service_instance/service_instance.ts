export enum ServiceType {
    GATEWAY = 'gateway',
    GAME_SERVICE = 'game-service',
    PLAYER_SERVICE = 'player-service',
}

export class ServiceInstance {
    constructor(
        public readonly id: string,
        public readonly type: ServiceType,
        public readonly url: string,
    ) {}

    toString(): string {
        return `ServiceInstance(id=${this.id}, type=${this.type}, url=${this.url})`;
    }
}
