from typing import List
from player_instance import PlayerInstance
from utils import getDateTime

class GameSessionLog:
    def __init__(self, player: PlayerInstance, message: str, type: str):
        self.playerName = player.name
        self.playerId = player.playerId
        self.message = message
        self.type = type
        self.dateTime = getDateTime()

    def toQueryFormat(self, gameSessionId):
        return (gameSessionId, self.dateTime, self.playerName, self.playerId, self.type, self.message)

class ConnectLog(GameSessionLog):
    def __init__(self, player: PlayerInstance, code: str):
        super().__init__(
            player,
            f"{player.name} connected to game session {code}",
            "connect"
        )

class DisconnectLog(GameSessionLog):
    def __init__(self, player: PlayerInstance, code: str):
        super().__init__(
            player,
            f"{player.name} disconnected from game session {code}",
            "disconnect"
        )

class MessageLog(GameSessionLog):
    def __init__(self, player: PlayerInstance, message: str):
        super().__init__(
            player,
            message,
            "message"
        )

class GameSession:
    def __init__(self, code):
        self.code = code
        self.current_player = 0
        self.game = None
        self.dateTime = getDateTime()
        self.currentPlayers: List[PlayerInstance] = []
        self.allAuthorizedPlayersIds: List[int] = []
        self.logs: List[GameSessionLog] = []

    def hasNoPlayers(self):
        return len(self.currentPlayers) == 0

    def addPlayer(self, name: str, playerId: int|None):
       
       playerInstance = PlayerInstance(name, playerId)
       self.currentPlayers.append(playerInstance)
       
       if playerId:
           self.allAuthorizedPlayersIds.append(playerInstance)

       self.logs.append(ConnectLog(self.currentPlayers[-1], self.code))
       return True

    def getPlayerInstance(self, name: str):
        for player in self.currentPlayers:
            if player.name == name:
                return player
        return None

    def removePlayer(self, name: str):
        player = self.getPlayerInstance(name)
        
        if player:
            self.currentPlayers.remove(player)
            self.logs.append(DisconnectLog(player, self.code))
        
    def logMessage(self, name: str, message: str):
        player = self.getPlayerInstance(name)
        if player:
            self.logs.append(MessageLog(player, message))

    def toQuery(self, uuid):
        return (uuid, self.dateTime, self.code)

    def getLogsForQuery(self, gameSessionId: int):
        return (log.toQueryFormat(gameSessionId) for log in self.logs)
            