import requests
from consts import GATEWAY_HOST, GATEWAY_PORT

class PlayerServiceClient:
    def authorizePlayer(authorization):
        url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/authorization"
        headers = {
            "Authorization": authorization
        }
        response = requests.get(url, headers=headers)
        return response.json(), response.status_code
    
    def getPlayerInfo(id):
        url = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}/players/{id}"
        response = requests.get(url)
        return response.json(), response.status_code