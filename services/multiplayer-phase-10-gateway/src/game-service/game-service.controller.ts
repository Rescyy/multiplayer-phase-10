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

    async getDirect(path: string, res: Response, headers?: any) {
        try {
            const playerServiceInstance = this.gameService.selectGameServiceInstance();
            if (playerServiceInstance === null) {
                throw ServiceUnavailableException;
            }
            playerServiceInstance.incrementLoad();
            const response = await this.httpWrapper.get(playerServiceInstance.url + `/${path}`, headers);
            playerServiceInstance.decrementLoad();
            res.status(response.status);
            return response.data;
        } catch (error) {
            res.status(error.status);
            return;
        }
    }
}
