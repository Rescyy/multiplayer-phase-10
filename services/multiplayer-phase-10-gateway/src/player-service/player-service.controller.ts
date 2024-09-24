import { Body, Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { PlayerServiceService } from './player-service.service';
import { HttpWrapper } from 'src/http/http.service';

@Controller()
export class PlayerServiceController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly playerService: PlayerServiceService) {}

    @Post('register')
    async register(@Body() body: any) {
        const playerServiceInstance = this.playerService.selectPlayerServiceInstance();
        if (playerServiceInstance === null) {
            throw ServiceUnavailableException;
        }
        playerServiceInstance.incrementLoad();
        const response = await this.httpWrapper.post(playerServiceInstance.url + '/register', body);
        playerServiceInstance.decrementLoad();
        return response.data;
    }

}
