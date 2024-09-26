from database import ConflictException, DatabaseAPI, NotFoundException
from cache import Cache
from random import choice
import string
from player_service_client import PlayerServiceClient

def generateCode():
    symbols = string.ascii_uppercase + string.digits
    random = ''.join([choice(symbols) for _ in range(6)])
    return random

class Response:
    @staticmethod
    def bad_request(payload):
        return {'message': str(payload)}, 400

    @staticmethod
    def not_found(payload):
        return {'message': str(payload)}, 404

    @staticmethod
    def server_error():
        return {'message': "Server side error occurred"}, 500

    @staticmethod
    def conflict(payload):
        return {'message': str(payload)}, 409

    @staticmethod
    def ok(payload):
        return payload, 200

    @staticmethod
    def created(payload):
        return payload, 201

class GameService:
    def __init__(self):
        self.dapi = DatabaseAPI()
        self.cache = Cache()
        self.playerService = PlayerServiceClient()

    def getGamesession(self, ip):
        code = generateCode()
        while self.cache.get(code):
            code = generateCode()
        self.cache.set(code, ip, ex=60)
        return code

    def connectPlayerToGame(self, code, reqIp, username):
        ip = self.cache.get(code)
        if not ip:
            print(f"Game session {code} not found")
            return Response.not_found("Game session not found")
        if ip != reqIp:
            print(f"IP {ip} did not create game session {code}")
            return Response.bad_request("You are not allowed to join this game session")
        print(f"Connecting {username} to game session {code}")
        return Response.ok("You are connected to the game session")

    def connectAuthorizedToGame(self, code, ip, authorization):
        json, status = self.playerService.authorizePlayer(authorization)
        if status != 200:
            print(f"Failed to authorize player {json}")
            return json, status
        id = json.get('id')
        json, status = self.playerService.getPlayerInfo(id)
        if status != 200:
            print(f"Failed to get player info {json}")
            return json, status
        return self.connectPlayerToGame(code, ip, json.get("name"))

print(GameService().getGamesession())