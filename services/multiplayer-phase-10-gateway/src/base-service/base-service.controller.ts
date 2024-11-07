import { HttpWrapper } from 'src/http/http.service';
import { BaseServiceService } from './base-service.service';
import {Response} from 'express';

export class BaseServiceController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly baseService: BaseServiceService) {}

    async postDirect(path: string, body: any, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const retries = 1;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (let i = 0; i < retries; i++) {
            for (const serviceInstance of serviceInstances) {
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
                        status = error.status;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
            }
            console.log("Multiple reroutes attempted for POST request.");
        }
        res.status(status);
        return;
    }

    async getDirect(path: string, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const retries = 1;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (let i = 0; i < retries; i++) {
            for (const serviceInstance of serviceInstances) {
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
                        status = error.status;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
            }
            console.log("Multiple reroutes attempted for GET request.");
        }
        res.status(status);
        return;
    }

    async deleteDirect(path: string, res: Response, headers?: any) {
        const serviceInstances = this.baseService.sortedByLoadServiceInstances();
        const retries = 1;
        let status = null;
        if (serviceInstances.length === 0) {
            res.status(503);
            return;
        }
        for (let i = 0; i < retries; i++) {
            for (const serviceInstance of serviceInstances) {
                try {
                    serviceInstance.incrementLoad();
                    const response = await this.httpWrapper
                    .delete(serviceInstance.url + `/${path}`, headers);
                    res.status(response.status);
                    return response.data;
                } catch (error) {
                    if (error.message === 'Timeout has occurred') {
                        status = 408;
                    }else if (error.status === undefined) {
                        status = 500;
                    } else {
                        status = error.status;
                    }
                } finally {
                    serviceInstance.decrementLoad();
                }
            }
            console.log("Multiple reroutes attempted for DELETE request.");
        }
        res.status(status);
        return;
    }

}
