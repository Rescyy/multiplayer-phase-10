import requests
import os
from dotenv import load_dotenv

load_dotenv()

class PlayerServiceClient:
    gateway_addr = f"http://{os.getenv("GATEWAY_HOST")}:{os.getenv("GATEWAY_PORT")}"

    def authorizePlayer(self, authorization):
        url = f"{self.gateway_addr}/authorization"
        headers = {
            "Authorization": authorization
        }
        response = requests.get(url, headers=headers, timeout=5)
        print(response)
        # print(response)
        if response.status_code == 200:
            return response.json(), response.status_code
        else:
            return "Failed to authorize player", response.status_code
    
    def getPlayerInfo(self, id):
        url = f"{self.gateway_addr}/players/{id}"
        response = requests.get(url, timeout=5)
        return response.json(), response.status_code