import requests
from consts import GATEWAY_HOST, GATEWAY_PORT

class PlayerServiceClient:
    def authorizePlayer(self, authorization):
        url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/authorization"
        headers = {
            "Authorization": authorization
        }
        response = requests.get(url, headers=headers)
        print(response)
        # print(response)
        if response.status_code == 200:
            return response.json(), response.status_code
        else:
            return "Failed to authorize player", response.status_code
    
    def getPlayerInfo(self, id):
        url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/players/{id}"
        response = requests.get(url)
        return response.json(), response.status_code