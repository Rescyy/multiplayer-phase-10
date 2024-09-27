from typing import List
from player_instance import PlayerInstance
# from typeguard import typechecked

# @typechecked
class GameSession:
    def __init__(self, code):
        self.code = code
        self.current_player = 0
        self.game = None
        self.players: List[PlayerInstance] = []

    def addPlayer(self, name: str):
       print(f"Connecting {name} to game session {self.code}")
       self.players.append(PlayerInstance(name, len(self.players)))

    def removePlayer(self, name: str):
        self.players = [player for player in self.players if player.name != name]