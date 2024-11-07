import { Controller, Get, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { GameServiceService } from './game-service.service';
import { HttpWrapper } from 'src/http/http.service';
import {Request, Response} from 'express';
import { BaseServiceController } from 'src/base-service/base-service.controller';

@Controller()
export class GameServiceController extends BaseServiceController {
    constructor(httpWrapper: HttpWrapper, gameService: GameServiceService) {
        super(httpWrapper, gameService);
    }

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

}
