import { Controller, Post, Req, Res } from '@nestjs/common';
import { GameServiceService } from 'src/game-service/game-service.service';
import { HttpWrapper } from 'src/http/http.service';
import { PlayerServiceService } from 'src/player-service/player-service.service';
import {Request, Response} from 'express';
import { randomUUID } from 'crypto';

@Controller()
export class TpccoordinatorController {
    constructor(private readonly httpWrapper: HttpWrapper, private readonly gameService: GameServiceService, private readonly playerService: PlayerServiceService) {

    }

    @Post('end-of-gamesession/:code')
    startEndOfGamesessionTPC(@Req() req: Request, @Res() res: Response) {
        const body = req.body;
        const playerIds = body["playerIds"];
        const serviceId = body["serviceId"];
        const serviceUrl = body["serviceUrl"];
        const code = req.params.code;
        const gameServiceInstance = this.gameService.getServiceInstance(serviceId);
        const playerServiceInstance = this.playerService.selectServiceInstance();
        
        console.log("tpcoordinator.controller.ts::startEndOfGamesessionTPC() ", gameServiceInstance.url, serviceUrl);

        if (gameServiceInstance === null || playerServiceInstance === null) {
            console.log("No game service or player service instances available");
            res.status(503);
            return;
        }

        if (gameServiceInstance.url !== serviceUrl) {
            console.log("Game service instance url does not match service url");
            res.status(400);
            return;
        }

        const uuid = randomUUID();

        setImmediate(async () => {
            console.log('End of gamesession TPC started');

            const gameServicePreparePromise = this.httpWrapper.delete(
                gameServiceInstance.url + `/end-of-gamesession/${code}/prepare/${uuid}`
            ).then(response => response.data);
            const playerServicePreparePromise = this.httpWrapper.delete(
                playerServiceInstance.url + `/end-of-gamesession/${code}/prepare/${uuid}`
            ).then(response => response.data);

            const gameServicePrepareResponse = await gameServicePreparePromise;
            const playerServicePrepareResponse = await playerServicePreparePromise;
            console.log('End of gamesession TPC prepared');

            if (gameServicePrepareResponse == "OK" && playerServicePrepareResponse == "OK") {
                const gameServiceCommitPromise = this.httpWrapper.delete(
                    gameServiceInstance.url + `/end-of-gamesession/${code}/commit`
                ).then(response => response.data);
                const playerServiceCommitPromise = this.httpWrapper.delete(
                    playerServiceInstance.url + `/end-of-gamesession/${code}/commit`
                ).then(response => response.data);

                const gameServiceCommitResponse = await gameServiceCommitPromise;
                const playerServiceCommitResponse = await playerServiceCommitPromise;
                console.log('End of gamesession TPC committed');

                if (gameServiceCommitResponse == "OK" && playerServiceCommitResponse == "OK") {
                    console.log('End of gamesession TPC completed');
                } else {
                    console.log('End of gamesession TPC failed');
                }
            } else {
                console.log('End of gamesession TPC failed');
                const abortGameServicePromise = this.httpWrapper.delete(
                    gameServiceInstance.url + `/end-of-gamesession/${code}/rollback`
                ).then(response => response.data);
                const abortPlayerServicePromise = this.httpWrapper.delete(
                    playerServiceInstance.url + `/end-of-gamesession/${code}/rollback`
                ).then(response => response.data);
            }
        });

        return;
    }
}
