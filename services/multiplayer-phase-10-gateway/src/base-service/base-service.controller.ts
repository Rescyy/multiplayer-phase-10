import { HttpWrapper } from 'src/http/http.service';
import { BaseServiceService } from './base-service.service';
import {Response} from 'express';


export class BaseServiceController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly baseService: BaseServiceService) {}

    async postDirect(path: string, body: any, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const RETRIES = 3;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (const serviceInstance of serviceInstances) {
            for (let i = 0; i < RETRIES; i++) {
                try {
                    serviceInstance.incrementLoad();
                    const response = await this.httpWrapper
                    .post(serviceInstance.url + `/${path}`, body, headers);
                    res.status(response.status);
                    return response.data;
                } catch (error) {
                    if (error.message === 'Timeout has occurred') {
                        status = 408;
                    }else if (error.status === undefined) {
                        status = 500;
                    } else {
                        res.status(error.status);
                        return;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
                console.log(`POST request failed on service instance ${serviceInstance}.`);
                console.log(`Retrying POST request; Attempt ${i + 1} of ${RETRIES}.`);
            }
            console.log(`Rerouting POST request to another service instance.`);
        }
        console.log(`POST request failed on all service instances.`);
        res.status(status);
        return;
    }

    async getDirect(path: string, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const RETRIES = 3;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (const serviceInstance of serviceInstances) {
            for (let i = 0; i < RETRIES; i++) {
                try {
                    serviceInstance.incrementLoad();
                    const response = await this.httpWrapper
                    .get(serviceInstance.url + `/${path}`, headers);
                    res.status(response.status);
                    return response.data;
                } catch (error) {
                    if (error.message === 'Timeout has occurred') {
                        status = 408;
                    }else if (error.status === undefined) {
                        status = 500;
                    } else {
                        res.status(error.status);
                        return;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
                console.log(`GET request failed on service instance ${serviceInstance}.`);
                console.log(`Retrying GET request; Attempt ${i + 1} of ${RETRIES}.`);
            }
            console.log(`Rerouting GET request to another service instance.`);
        }
        console.log(`GET request failed on all service instances.`);
        res.status(status);
        return;
    }

    async deleteDirect(path: string, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const RETRIES = 3;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (const serviceInstance of serviceInstances) {
            for (let i = 0; i < RETRIES; i++) {
                try {
                    serviceInstance.incrementLoad();
                    const response = await this.httpWrapper
                    .get(serviceInstance.url + `/${path}`, headers);
                    res.status(response.status);
                    return response.data;
                } catch (error) {
                    if (error.message === 'Timeout has occurred') {
                        status = 408;
                    }else if (error.status === undefined) {
                        status = 500;
                    } else {
                        res.status(error.status);
                        return;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
                console.log(`DELETE request failed on service instance ${serviceInstance}.`);
                console.log(`Retrying DELETE request; Attempt ${i + 1} of ${RETRIES}.`);
            }
            console.log(`Rerouting DELETE request to another service instance.`);
        }
        console.log(`DELETE request failed on all service instances.`);
        res.status(status);
        return;
    }

}
