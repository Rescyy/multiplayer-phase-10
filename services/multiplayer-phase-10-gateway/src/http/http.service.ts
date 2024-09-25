import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class HttpWrapper {


    constructor(private readonly httpService: HttpService) {}
    async post(url: string, body: any, headers?: any): Promise<AxiosResponse> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.post(url, body, options).pipe(
                timeout(5000),    // Timeout after 5000ms (5 seconds)
            )
        );
        return response;
    }
    async get(url: string, headers?: any): Promise<AxiosResponse> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.get(url, options).pipe(
                timeout(5000),    // Timeout after 5000ms (5 seconds)
            )
        );
        return response;
        
    }
}
