import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, firstValueFrom, retry, throwError, timeout } from 'rxjs';

@Injectable()
export class HttpWrapper {
    constructor(private readonly httpService: HttpService) {}
    async post(url: string, body: any): Promise<AxiosResponse> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(url, body).pipe(
                    timeout(5000),    // Timeout after 5000ms (5 seconds)
                    retry(3),         // Retry up to 3 times on failure
                    catchError((error) => {
                        if (error.name === 'TimeoutError') {
                            // Throw a 408 Request Timeout error
                            throw new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT);
                        }
                        return throwError(() => new Error('Request failed'));
                    })
                )
            );
            return response;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error; // Re-throw if it's an HttpException
            }
            throw new HttpException(`Failed to post request: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async get(url: string): Promise<AxiosResponse> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(url).pipe(
                    timeout(5000),    // Timeout after 5000ms (5 seconds)
                    retry(3),         // Retry up to 3 times on failure
                    catchError((error) => {
                        if (error.name === 'TimeoutError') {
                            // Throw a 408 Request Timeout error
                            throw new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT);
                        }
                        console.error('HTTP request failed:', error);
                        return throwError(() => new Error('Request failed'));
                    })
                )
            );
            return response;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error; // Re-throw if it's an HttpException
            }
            throw new HttpException(`Failed to fetch data: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
