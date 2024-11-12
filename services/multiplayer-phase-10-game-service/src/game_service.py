from database import DatabaseAPI
from cache import Cache
from random import choice, randrange
import string
from player_service_client import PlayerServiceClient
from game_session import GameSession
from typing import Dict
from gateway_client import GatewayClient

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

"""
The GameService class is responsible for managing game sessions and players. 
It uses a DatabaseAPI instance to interact with the database, 
a Cache instance to store game session codes, 
a PlayerServiceClient instance to interact with the player service, 
and a set to store player names.

Client 1 requests a code to connect to a game session
The code is stored in cache with a 4 minute expiration time
The code is returned to the client

Client 1 connects to the game session
The game session instance is created
The code expiration time is extended indefinitely
The player is added to the game session
The player is added to the set of players

Client 2 connects to the game session
The player is added to the game session
The player is added to the set of players

Client 1 and 2 disconnect from the game session
The players are removed from the game session
The players are removed from the set of players
The game session is deleted
The code is deleted from cache

"""

class GameService:
    def __init__(self):
        self.dapi = DatabaseAPI()
        self.cache = Cache()
        self.playerService = PlayerServiceClient()
        self.gatewayClient = GatewayClient()
        self.gameSessions: Dict[str, GameSession] = {}

    def sessionExists(self, code):
        return self.cache.exists(f"Code:{code}")

    def getGamesession(self):

        code = generateCode()
        while self.sessionExists(code):
            code = generateCode()

        self.cache.set(f"Code:{code}", "magic", ex=240)

        return Response.ok(code)

    def requestGameSession(self, code):

        magic = self.cache.get(code)
        if magic == "magic":
            self.cache.set(code, magic)
        
        return Response.ok("You are connected to the game session")

    def requestGuestGameSession(self, code):
        
        username = f"guest_{randrange(100_000,1_000_000)}"
        while username in self.players:
            username = f"guest_{randrange(100_000,1_000_000)}"

        result = self.requestGameSession(code)

        return result, username

    def requestAuthorizedGameSession(self, code, authorization):
        result, status = self.playerService.authorizePlayer(authorization)

        if status != 200:
            return ("Failed to authorize player", status), None
        id = result.get('id')

        result, status = self.playerService.getPlayerInfo(id)
        if status != 200:
            return (result, status), None
        username = result.get("player").get("name")

        if self.cache.exists(f"Player:{username}"):
            return Response.conflict("Player already connected to a game session."), None

        result = self.requestGameSession(code)

        return result, (username, id)

    def connectPlayer(self, code, username, playerId: int|None):
        gameSession = GameSession(code)
        gameSession.addPlayer(username, playerId)
        self.gameSessions[code] = gameSession
        self.cache.set(f"Player:{username}", "magic")

    def disconnectPlayer(self, code, username):
        gameSession: GameSession = self.gameSessions.get(code)
        if gameSession:
            gameSession.removePlayer(username)
        self.cache.delete(f"Player:{username}", "magic")

        if gameSession.hasNoPlayers():
            try:
                self.gatewayClient.informEndOfGamesession(code, gameSession.allAuthorizedPlayersIds)
            except:
                # remove without saving to database
                self.gameSessions.pop(code)

    def logMessage(self, code, username, message):
        gameSession: GameSession = self.gameSessions.get(code)
        if gameSession:
            gameSession.logMessage(username, message)

    def prepareEndOfGameSession(self, code, uuid):
        gameSession = self.gameSessions.get(code)
        self.dapi.prepareEndOfGameSession(gameSession.toQuery(uuid), gameSession.getLogsForQuery(uuid))

    def commitEndOfGameSession(self, code):
        self.dapi.commitEndOfGameSession()
        if code in self.gameSessions:
            self.gameSessions.pop(code)

    def rollbackEndOfGameSession(self, code):
        self.dapi.rollbackEndOfGameSession()

    
    