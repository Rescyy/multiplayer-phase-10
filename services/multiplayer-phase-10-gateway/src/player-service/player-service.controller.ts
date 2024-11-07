import { Body, Controller, Delete, Get, InternalServerErrorException, Post, Req, RequestTimeoutException, Res, ServiceUnavailableException } from '@nestjs/common';
import { PlayerServiceService } from './player-service.service';
import { HttpWrapper } from 'src/http/http.service';
import {Request, Response} from 'express';
import { BaseServiceController } from 'src/base-service/base-service.controller';

@Controller()
export class PlayerServiceController extends BaseServiceController {
    constructor(httpWrapper: HttpWrapper, playerService: PlayerServiceService) {
        super(httpWrapper, playerService);
    }

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
    players(@Res({ passthrough: true }) res: Response) {
        return this.getDirect('players', res);
    }

    @Get('players/:id')
    player(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('players/' + req.params.id, res);
    }

}
