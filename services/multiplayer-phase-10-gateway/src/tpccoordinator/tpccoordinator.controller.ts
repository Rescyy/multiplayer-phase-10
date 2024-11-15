import { Controller, Post, Req, Res } from '@nestjs/common';
import { GameServiceService } from 'src/game-service/game-service.service';
import { HttpWrapper } from 'src/http/http.service';
import { PlayerServiceService } from 'src/player-service/player-service.service';
import { Request, Response } from 'express';
import { randomUUID, UUID } from 'crypto';

type CallbackFunction = () => void;
@Controller()
export class TpccoordinatorController {


    private readonly rollbackCallbacks = new Map<UUID, Array<CallbackFunction>>();

    constructor(private readonly httpWrapper: HttpWrapper, private readonly gameService: GameServiceService, private readonly playerService: PlayerServiceService) {

    }

    @Post('end-of-gamesession/:code')
    async startEndOfGamesessionTPC(@Req() req: Request, @Res() res: Response) {
        const body = req.body;
        const playerIds = body["playerIds"] ? body["playerIds"] : [];
        const serviceId = body["serviceId"];
        const serviceUrl = body["serviceUrl"];
        const code = req.params.code;

        const gameServiceInstance = this.gameService.getServiceInstance(serviceId);
        const playerServiceInstance = this.playerService.selectServiceInstance();

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
        const transactionUUID = randomUUID();

        this.rollbackCallbacks.set(transactionUUID, []);

        var shouldRollback = false;
        
        var gameServiceTransactionPromise = Promise.resolve();
        var playerServiceTransactionPromise = Promise.resolve();

        try {

            gameServiceInstance.incrementLoad();
            gameServiceTransactionPromise = this.httpWrapper.patch(
                gameServiceInstance.url + `/end-of-gamesession/${code}/${transactionUUID}`,
            )
                .catch((error) => {
                    console.log(error.message);
                    console.log("Caught error, doing the rollback 1");
                    if (!shouldRollback) {
                        shouldRollback = true;
                    }
                    return { data: "ERR" };
                })
                .then((result) => {
                    const data = result.data;
                    if (data !== "OK") {
                        return;
                    }
                    console.log("Game service transaction completed");
                    this.rollbackCallbacks.get(transactionUUID).push(
                        () => {
                            this.httpWrapper.patch(
                                gameServiceInstance.url + `/end-of-gamesession/${transactionUUID}/rollback`
                            );
                        }
                    )
                });
        } catch (e) {

        } finally {
            gameServiceInstance.decrementLoad();
        }

        try{
            playerServiceInstance.incrementLoad();
            playerServiceTransactionPromise = this.httpWrapper.patch(
                playerServiceInstance.url + `/end-of-gamesession/${transactionUUID}`,
                { "playerIds": playerIds },
            )
                .catch((error) => {
                    console.log(error.message);
                    console.log("Caught error, doing the rollback 2");
                    if (!shouldRollback) {
                        shouldRollback = true;
                    }
                    return { data: "ERR" };
                })
                .then((result) => {
                    const data = result.data;
                    if (data !== "OK") {
                        return;
                    }
                    console.log("Player service transaction completed");
                    this.rollbackCallbacks.get(transactionUUID).push(
                        () => {
                            this.httpWrapper.patch(
                                playerServiceInstance.url + `/end-of-gamesession/${transactionUUID}/rollback`
                            );
                        }
                    )
                });
        } catch (e) {

        } finally {
            playerServiceInstance.decrementLoad();
        }
        
        await Promise.all([gameServiceTransactionPromise, playerServiceTransactionPromise]);
        
        if (shouldRollback) {
            this.rollbackCallbacks.get(transactionUUID).forEach((callback) => {
                callback();
            });
        }

        return;
    }
}
