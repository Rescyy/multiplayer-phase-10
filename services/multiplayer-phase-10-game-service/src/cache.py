import redis
import json
from datetime import date
import os

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)
    
def dumps(obj):
    return json.dumps(obj, cls=DateTimeEncoder)

def as_datetime(dct):
    for key, value in dct.items():
        try:
            dct[key] = date.fromisoformat(value)
        except (ValueError, TypeError):
            pass
    return dct

def loads(s):
    return json.loads(s, object_hook=as_datetime)

class Cache:
    def __init__(self):
        try:
            self.cache = redis.Redis(host=os.getenv("REDIS_HOST"), port=os.getenv("REDIS_PORT"), db=0)
            self._magicstring = "game-service:"
            self.cache.ping()
            print("Connected to cache")
        except:
            self.cache = None
            print("Failed to connect to cache")

    def exists(self, key):
        if self.cache is None:
            return False
        
        return self.cache.exists(self._magicstring + key) == 1

    def get(self, key):
        if self.cache is None:
            return None
        
        value = self.cache.get(self._magicstring + key)
        if value is None:
            return None
        
        value = loads(value)
        data_type = value["type"]
        
        if data_type in {"list", "dict"}:
            return value["value"]
        return value["value"]

    
    def set(self, key, value, ex=None):
        if self.cache is None:
            return None
        
        if isinstance(value, list):
            value = dumps({"type": "list", "value": value})
        elif isinstance(value, dict):
            value = dumps({"type": "dict", "value": value})
        elif isinstance(value, str):
            value = dumps({"type": "str", "value": value})
        elif isinstance(value, int):
            value = dumps({"type": "int", "value": value})
        elif isinstance(value, float):
            value = dumps({"type": "float", "value": value})
        elif isinstance(value, bool):
            value = dumps({"type": "bool", "value": value})

        return self.cache.set(self._magicstring + key, value, ex=ex)

    def delete(self, key):
        if self.cache == None:
            return None
        return self.cache.delete(self._magicstring + key)
