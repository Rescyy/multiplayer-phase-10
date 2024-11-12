import os
import requests
from subscribe import myUrl, myId

class GatewayClient:
    gateway_addr = f"http://{os.getenv("GATEWAY_HOST")}:{os.getenv("GATEWAY_PORT")}"

    def informEndOfGamesession(self, code, players: list[int]):
        url = f"{self.gateway_addr}/end-of-gamesession/{code}"
        response = requests.post(url, data={
            "playerIds": players,
            "serviceId": myId,
            "serviceUrl": myUrl
        })

        if response.status_code != 200:
            raise Exception("Failed to inform end of game session")
