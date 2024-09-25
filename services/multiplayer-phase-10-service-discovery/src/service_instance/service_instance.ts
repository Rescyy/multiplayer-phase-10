export enum ServiceType {
    GATEWAY = 0,
    GAME_SERVICE = 1,
    PLAYER_SERVICE = 2,
}

export class ServiceInstance {
        
    public errors: {error: string, time: number}[] = [];

    constructor(
        public readonly id: string,
        public readonly type: ServiceType,
        public readonly url: string,
        public readonly healthcheckPeriod: number  
    ) {}

    toString(): string {
        return `ServiceInstance(id=${this.id}, type=${this.type}, url=${this.url})`;
    }
}
