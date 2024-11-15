import os
import requests
from subscribe import me
from dotenv import load_dotenv
from player_instance import PlayerInstance

load_dotenv()

class GatewayClient:
    gateway_addr = f"http://{os.getenv("GATEWAY_HOST")}:{os.getenv("GATEWAY_PORT")}"

    def informEndOfGamesession(self, code, players: list[PlayerInstance]):
        url = f"{self.gateway_addr}/end-of-gamesession/{code}"
        print("Informing end of game session")
        playerIds = [player.id for player in players]
        print(playerIds)
        response = requests.post(url, data={
            "playerIds": playerIds,
            "serviceId": me.id,
            "serviceUrl": me.url
        })

        print(response.status_code)
        if response.status_code != 200:
            raise Exception("Failed to inform end of game session")
