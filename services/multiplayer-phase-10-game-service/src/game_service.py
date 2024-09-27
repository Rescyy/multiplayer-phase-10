from database import DatabaseAPI
from cache import Cache
from random import choice, randrange
import string
from player_service_client import PlayerServiceClient
from game_session import GameSession


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
        self.gameSessions = {}
        self.players = set()

    def getGamesession(self, ip):
        code = generateCode()
        while self.cache.get(code):
            code = generateCode()
        self.cache.set(code, ip, ex=60)
        return Response.ok(code)

    def requestGameSession(self, code, ip, username):
        gamesession: GameSession = self.gameSessions.get(code)
        if gamesession != None:
            pass
        else:
            cachedIp = self.cache.get(code)
            if not cachedIp:
                print(f"Game session {code} not found")
                return Response.not_found("Game session not found")
            if cachedIp != ip:
                print(f"IP {ip} did not create game session {code}")
                return Response.bad_request("You are not allowed to join this game session")
                           
            gamesession = GameSession(code)
            self.gameSessions[code] = gamesession
        self.players.add(username)
        gamesession.addPlayer(username)
        return Response.ok("You are connected to the game session"), username

    def requestGuestGameSession(self, code, ip):
        username = f"guest_{randrange(100_000,1_000_000)}"
        while username in self.players:
            username = f"guest_{randrange(100_000,1_000_000)}"
        return self.requestGameSession(code, ip, username)


    def requestAuthorizedGameSession(self, code, ip, authorization):
        json, status = self.playerService.authorizePlayer(authorization)
        if status != 200:
            print(f"Failed to authorize player {json}")
            return "Failed to authorize player", status
        id = json.get('id')
        json, status = self.playerService.getPlayerInfo(id)
        if status != 200:
            print(f"Failed to get player info {json}")
            return json, status
        name = json.get("player").get("name")
        return self.requestGameSession(code, ip, name)
    
    