from database import ConflictException, DatabaseAPI, NotFoundException
from cache import Cache
from flask import jsonify

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

class PlayerService:
    def __init__(self):
        self.dapi = DatabaseAPI()
        self.cache = Cache()

    def handle_database_request(self, func):
        try:
            result = func()
        except ValueError as e:
            return Response.bad_request(e)
        except NotFoundException as e:
            return Response.not_found(e)
        except ConflictException as e:
            return Response.conflict(e)
        except:
            return Response.server_error()
        
        return result, 200

    def cache_result(self, key, result):
        if result[1] == 200:
            self.cache.set(key, result[0])

    def register_player(self, name: str, password: str):
        result = self.handle_database_request(lambda: self.dapi.register_player(name, password))
        if result[1] == 200:
            self.cache.delete("all")
        return result
    
    def login_player(self, name: str, password: str):
        return self.handle_database_request(lambda: self.dapi.login_player(name, password))

    def get_id_by_name(self, name: str):
        result = self.cache.get(name)
        if result != None:
            return Response.ok(result)
        result = self.handle_database_request(lambda: self.dapi.get_id_by_name(name))
        self.cache_result(name, result)
        return result
    
    def get_all_players(self):
        result = self.cache.get("all")
        if result != None:
            return Response.ok(result)
        result = self.handle_database_request(lambda: self.dapi.get_all_players())
        self.cache_result("all", result)
        return result
    
    def get_player_by_id(self, id: int):
        result = self.cache.get(str(id))
        if result != None:
            return Response.ok(result)
        result = self.handle_database_request(lambda: self.dapi.get_player_by_id(id))
        self.cache_result(str(id), result)
        return result
    
    def update_player_game(self, id: int, won: bool):
        result = self.handle_database_request(lambda: self.dapi.update_player_game(id, won))
        if result[1] == 200:
            self.cache.delete("all")
        return result
    