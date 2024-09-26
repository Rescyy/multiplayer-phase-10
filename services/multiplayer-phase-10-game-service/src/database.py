import time
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from consts import PLAYER_DB_PORT

class NotFoundException(Exception):
    pass

class ConflictException(Exception):
    pass

class DatabaseAPI:
    def __init__(self):
        # if not self.connect_to_db_as_deployed():
            # self.connect_to_db_as_local()
        if not self.connect_to_db_as_local():
            self.connect_to_db_as_deployed()
        
    def connect_to_db_as_deployed(self):
        self.dbname = "game-service-db"
        self.user = "game_db"
        self.password = "1234"
        # self.host = "localhost"
        self.host = "game-db"
        # self.port = 5433
        self.port = PLAYER_DB_PORT
        self.connection = None
        retries = 2
        for i in range(retries):
            try:
                print("Trying to connect to database as deployed")
                self.connection = psycopg2.connect(dbname=self.dbname, user=self.user, password=self.password, host=self.host, port=self.port)
                self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                self.cursor = self.connection.cursor()
                break
            except Exception as e:
                print(e)
                if i == retries - 1:
                    break
            finally:
                time.sleep(1)
        if self.connection == None:
            print("Failed to connect to database as deployed")
            return False
        else:
            dsn_params = self.connection.get_dsn_parameters()
            db_host = dsn_params.get('host')
            print(f"Connected to database {db_host}:{self.port}")
            return True
    
    def connect_to_db_as_local(self):
        self.dbname = "game-service-db"
        self.user = "game_db"
        self.password = "1234"
        self.host = "localhost"
        self.port = 5433
        self.connection = None
        retries = 2
        for i in range(retries):
            try:
                print("Trying to connect to database as local")
                self.connection = psycopg2.connect(dbname=self.dbname, user=self.user, password=self.password, host=self.host, port=self.port)
                self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                self.cursor = self.connection.cursor()
                break
            except Exception as e:
                if i == retries - 1:
                    break
                print(e)
            finally:
                time.sleep(1)
        if self.connection == None:
            print("Failed to connect to database as local")
            return False
        else:
            dsn_params = self.connection.get_dsn_parameters()
            db_host = dsn_params.get('host')
            print(f"Connected to database {db_host}:{self.port}")
            return True

    def register_player(self, name: str, password: str):
        if name == None:
            raise ValueError("Username must not be null")
        if password == None:
            raise ValueError("Password must not be null")
        if (type(name) != str or type(password) != str):
            raise ValueError("Username and password must be strings")
        if (len(name) == 0 or len(password) == 0):
            raise ValueError("Username and password must not be empty")
        if (len(name) > 255 or len(password) > 255):
            raise ValueError("Username and password must be less than 255 characters")
        try:
            self.cursor.execute("INSERT INTO players (name, password) VALUES (%s, %s)", (name, password))
        except:
            raise ConflictException("Username already exists")
        

    def login_player(self, name: str, password: str) -> int:
        self.cursor.execute("SELECT id FROM players WHERE name=%s AND password=%s", (name, password))
        id = self.cursor.fetchone()
        if (id == None):
            raise NotFoundException("Invalid username or password")
        return id[0]

    def get_id_by_name(self, name: str) -> int:
        self.cursor.execute("SELECT id FROM players WHERE name=%s", (name,))
        id = self.cursor.fetchone()
        if (id == None):
            raise NotFoundException("Username not found")
        return id[0]

    def get_all_players(self):
        self.cursor.execute("SELECT * FROM players")
        players = self.cursor.fetchall()
        return [self.map_player_to_object(player) for player in players]
    
    def get_player_by_id(self, id: int):
        self.cursor.execute("SELECT * FROM players WHERE id=%s", (id,))
        player_tuple = self.cursor.fetchone()
        if (player_tuple == None):
            raise NotFoundException("Id not found")
        return self.map_player_to_object(player_tuple)
    
    def map_player_to_object(self, player_tuple):
        return {
            "id": player_tuple[0],
            "creation-time": player_tuple[1],
            "name": player_tuple[2],
            "games-played": player_tuple[4],
            "games-won": player_tuple[5]
        }

    def update_player_game(self, id: int, won: bool):
        self.get_player_by_id(id)
        if type(won) != bool and won != None:
            raise ValueError("Won must be a boolean")
        if won:
            self.cursor.execute("UPDATE players SET games_played = games_played + 1, games_won = games_won + 1 WHERE id = %s", (id,))
        else:
            self.cursor.execute("UPDATE players SET games_played = games_played + 1 WHERE id = %s", (id,))

    