import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, RequestTimeoutException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, timeout , catchError, retry } from 'rxjs';

@Injectable()
export class HttpWrapper {

    constructor(private readonly httpService: HttpService) {}
    async post(url: string, body: any, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.post(url, body, options).pipe(
                timeout(5000),
            )
        );
        return response;
    }
    async get(url: string, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.get(url, options).pipe(
                timeout(5000),
            )
        );
        return response;

    }

    async delete(url: string, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.delete(url, options).pipe(
                timeout(5000),
            )
        );
        return response;
        
    }

    async patch(url: string, data?: any, headers?: any, abortController?: AbortController): Promise<AxiosResponse<any, any>> {
        
        const options = {};
        if (headers) {
            options['headers'] = headers;
        }
        if (abortController) {
            options['signal'] = abortController.signal;
        }
        data = data ? data : {};
        const response = await firstValueFrom(
            this.httpService.patch(url, data, options).pipe(
                timeout(5000),
            )
        );
        return response;
    }
}
