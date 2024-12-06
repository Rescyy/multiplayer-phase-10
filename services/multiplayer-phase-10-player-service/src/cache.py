from redis.cluster import RedisCluster as Redis
from redis.cluster import ClusterNode
import json
from datetime import date
import os
import elk
import time

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
        self._magicstring = "player-service:"
        try:
            self.cache = Redis(host="redis-node-1", port=6379)
            self.cache.ping()
            print(f"Connected to cache cluster.\nNodes: {self.cache.get_nodes()}")
        except Exception as e:
            self.cache = None
            print("Failed to connect to cache")
            print(e)

    def get(self, key, resource_name=None):
        if self.cache is None:
            return None
        
        start = time.time()
        value = self.cache.get(self._magicstring + key)
        if value is None:
            elk.log_cache_miss((time.time() - start) * 1000, resource_name)
            return None
        elk.log_cache_hit((time.time() - start) * 1000, resource_name)

        value = loads(value)
        data_type = value["type"]
        
        if data_type in {"list", "dict"}:
            return value["value"]
        return value["value"]

    
    def set(self, key, value, ex=3600):
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

globalCache = Cache()