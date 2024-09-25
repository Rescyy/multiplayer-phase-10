import { Body, Controller, Get, Post, Req, Res, ServiceUnavailableException } from '@nestjs/common';
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
        console.log(req.headers.authorization);
        return this.getDirect('authorization', res, req.headers);
    }

    @Get('players')
    players(@Res({ passthrough: true }) res: Response) {
        return this.getDirect('players', res);
    }

    @Get('players/:id')
    player(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        return this.getDirect('players/' + req.params.id, res);
    }

    async postDirect(path: string, body: any, res: Response, headers?: any) {
        try {
            const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
            if (playerServiceInstance === null) {
                throw ServiceUnavailableException;
            }
            playerServiceInstance.incrementLoad();
            const response = await this.httpWrapper.post(playerServiceInstance.url + `/${path}`, body, headers);
            playerServiceInstance.decrementLoad();
            res.status(response.status);
            return response.data;
        } catch (error) {
            res.status(error.status);
            return;
        }
    }

    async getDirect(path: string, res: Response, headers?: any) {
        try {
            const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
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
