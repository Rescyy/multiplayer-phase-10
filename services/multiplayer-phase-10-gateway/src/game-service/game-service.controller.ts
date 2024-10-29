import { Controller, Get, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { GameServiceService } from './game-service.service';
import { HttpWrapper } from 'src/http/http.service';
import {Request, Response} from 'express';

@Controller()
export class GameServiceController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly gameService: GameServiceService) {}

    @Get('gamesession')
    getGameSession(@Res({ passthrough: true }) res: Response) {
        return this.getDirect('gamesession', res);
    }

    @Get('gamesession/authorized/:code')
    getGameSessionAuthorized(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('gamesession/authorized/' + req.params.code, res, req.headers);
    }

    @Get('gamesession/guest/:code')
    getGameSessionGuest(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('gamesession/guest/' + req.params.code, res);
    }

    async postDirect(path: string, body: any, res: Response, headers?: any) {
        const gameServiceInstance = this.gameService.selectGameServiceInstance();
        try {
            if (gameServiceInstance === null) {
                res.status(503);
                return;
            }
            gameServiceInstance.incrementLoad();
            const response = await this.httpWrapper
            .post(gameServiceInstance.url + `/${path}`, body, headers);
            gameServiceInstance.decrementLoad();
            res.status(response.status);
            return response.data;
        } catch (error) {
            if (gameServiceInstance !== null) {
                gameServiceInstance.decrementLoad();
            }
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
        }
    }

    async getDirect(path: string, res: Response, headers?: any) {
        const gameServiceInstance = this.gameService.selectGameServiceInstance();
        try {
            if (gameServiceInstance === null) {
                res.status(503);
                return;
            }
            gameServiceInstance.incrementLoad();
            const response = await this.httpWrapper
            .get(gameServiceInstance.url + `/${path}`, headers);
            gameServiceInstance.decrementLoad();
            res.status(response.status);
            return response.data;
        } catch (error) {

            if (gameServiceInstance !== null) {
                gameServiceInstance.decrementLoad();
            }
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
        }
    }

    async deleteDirect(path: string, res: Response, headers?: any) {
        const gameServiceInstance = this.gameService.selectGameServiceInstance();
        try {
            if (gameServiceInstance === null) {
                res.status(503);
                return;
            }
            gameServiceInstance.incrementLoad();
            const response = await this.httpWrapper.delete(gameServiceInstance.url + `/${path}`, headers);
            gameServiceInstance.decrementLoad();
            res.status(response.status);
            return response.data;
        } catch (error) {
            if (gameServiceInstance !== null) {
                gameServiceInstance.decrementLoad();
            }
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
        }
    }
}
