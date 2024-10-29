import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, RequestTimeoutException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, timeout , catchError } from 'rxjs';

@Injectable()
export class HttpWrapper {

    constructor(private readonly httpService: HttpService) {}
    async post(url: string, body: any, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.post(url, body, options).pipe(
                timeout(5000),    // Timeout after 5000ms (5 seconds)
            )
        );
        return response;
    }
    async get(url: string, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.get(url, options).pipe(
                timeout(5000),    // Timeout after 5000ms (5 seconds)
            )
        );
        return response;

    }

    async delete(url: string, headers?: any): Promise<any> {
        
        const options = headers ? { headers } : undefined;
        const response = await firstValueFrom(
            this.httpService.delete(url, options).pipe(
                timeout(5000),    // Timeout after 5000ms (5 seconds)
            )
        );
        return response;
        
    }
}
