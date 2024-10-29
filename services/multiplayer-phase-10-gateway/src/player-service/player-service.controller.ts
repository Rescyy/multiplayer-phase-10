import { Body, Controller, Delete, Get, InternalServerErrorException, Post, Req, RequestTimeoutException, Res, ServiceUnavailableException } from '@nestjs/common';
import { PlayerServiceService } from './player-service.service';
import { HttpWrapper } from 'src/http/http.service';
import {Request, Response} from 'express';

@Controller()
export class PlayerServiceController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly playerService: PlayerServiceService) {}

    @Post('register')
    register(@Body() body: any, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.postDirect('register', body, res);
    }

    @Post('login')
    login(@Body() body: any, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.postDirect('login', body, res);
    }

    @Get('authorization')
    authorization(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('authorization', res, req.headers);
    }

    @Delete('logout')
    logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.deleteDirect('logout', res, req.headers);
    }

    @Get('players')
    async players(@Res({ passthrough: true }) res: Response) {
        var response = await this.getDirect('players', res);
        return response;
    }

    @Get('players/:id')
    player(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('players/' + req.params.id, res);
    }

    async postDirect(path: string, body: any, res: Response, headers?: any) {
        const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
        try {
            if (playerServiceInstance === null) {
                res.status(503);
                return;
            }
            playerServiceInstance.incrementLoad();
            const response = await this.httpWrapper
            .post(playerServiceInstance.url + `/${path}`, body, headers);
            res.status(response.status);
            return response.data;
        } catch (error) {
            if (error.message === 'Timeout has occurred') {
                res.status(408);
                return;
            }
            if (error.status === undefined) {
                res.status(500);
                return;
            }
            res.status(error.status);
            return;
        } finally {
            if (playerServiceInstance !== null) {
                playerServiceInstance.decrementLoad();
            }
        }
    }

    async getDirect(path: string, res: Response, headers?: any) {
        const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
        try {
            if (playerServiceInstance === null) {
                res.status(503);
                return;
            }
            playerServiceInstance.incrementLoad();
            const response = await this.httpWrapper
            .get(playerServiceInstance.url + `/${path}`, headers);
            res.status(response.status);
            return response.data;
        } catch (error) {
            if (error.message === 'Timeout has occurred') {
                res.status(408);
                return;
            }
            if (error.status === undefined) {
                res.status(500);
                return;
            }
            res.status(error.status);
            return;
        } finally {
            if (playerServiceInstance !== null) {
                playerServiceInstance.decrementLoad();
            }
        }
    }

    async deleteDirect(path: string, res: Response, headers?: any) {
        const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
        try {
            if (playerServiceInstance === null) {
                res.status(503);
                return;
            }
            playerServiceInstance.incrementLoad();
            const response = await this.httpWrapper.delete(playerServiceInstance.url + `/${path}`, headers);
            
            res.status(response.status);
            return response.data;
        } catch (error) {
            if (error.message === 'Timeout has occurred') {
                res.status(408);
                return;
            }
            if (error.status === undefined) {
                res.status(500);
                return;
            }
            res.status(error.status);
            return;
        } finally {
            if (playerServiceInstance !== null) {
                playerServiceInstance.decrementLoad();
            }
        }
    }

}
