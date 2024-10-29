import { Mutex } from "async-mutex";
import { ServiceType } from "./service_instance";

export class ServiceInstanceLoaded {
    constructor(
        public readonly id: string,
        public readonly type: ServiceType,
        public readonly url: string,
        public load: number = 0,
        private readonly maxLoad: number = 100,
        private readonly mutex: Mutex = new Mutex(),
    ) {};

    async incrementLoad() {
        const release = await this.mutex.acquire();
        if (this.load < this.maxLoad) {
            this.load++;
        }
        if (this.load > this.maxLoad * 0.5) {
            console.log(`ServiceInstance ${this.id} is at ${this.load / this.maxLoad * 100}% load`);
        }
        release();
    }

    async decrementLoad() {
        const release = await this.mutex.acquire();
        if (this.load > 0) {
            this.load--;
        }
        release();
    }

    isAtMaxLoad(): boolean {
        return this.load >= this.maxLoad;
    }
}