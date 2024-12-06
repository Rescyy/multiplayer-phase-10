import time
import psycopg2
from psycopg2 import DatabaseError, OperationalError
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import elk

class NotFoundException(Exception):
    pass

class ConflictException(Exception):
    pass

class DatabaseAPI:
    def __init__(self):
        self.connect_to_db()
        
    def connect_to_db(self):
        self.dbname = "player-service-db"
        self.user = "player_db"
        self.password = "1234"
        self.host = os.getenv("PLAYER_DB_HOST")
        self.port = os.getenv("PLAYER_DB_PORT")
        self.connection = None
        retries = 2
        for i in range(retries):
            try:
                print("Trying to connect to database")
                self.connection = psycopg2.connect(dbname=self.dbname, user=self.user, password=self.password, host=self.host, port=self.port)
                self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                self.cursor = self.connection.cursor()
                break
            except Exception as e:
                print(e)
                if i == retries - 1:
                    break
                time.sleep(1)
        if self.connection == None:
            print("Failed to connect to database")
            return False
        else:
            dsn_params = self.connection.get_dsn_parameters()
            db_host = dsn_params.get('host')
            print(f"Connected to database {db_host}:{self.port}")
            self.create_tables_if_not_present()
            return True

    def create_tables_if_not_present(self):
        query_path = os.getenv("QUERY_PATH")

        start = time.time()
        try:
            with open(f"{query_path}/create_table_players.sql", "r") as file:
                query = file.read()
                self.cursor.execute(query)

            with open(f"{query_path}/create_table_player_gamesessions.sql", "r") as file:
                query = file.read()
                self.cursor.execute(query)

        except Exception as e:
            elk.log_failed_database_query("create_tables_if_not_present", (time.time() - start) * 1000, e)
        
        elk.log_database_query("create_tables_if_not_present", (time.time() - start) * 1000)

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
        
        start = time.time()

        try:
            self.cursor.execute("INSERT INTO players (name, password) VALUES (%s, %s)", (name, password))
        except psycopg2.errors.UniqueViolation as e:
            elk.log_database_query("register_player", (time.time() - start) * 1000)
            raise ConflictException("Username already exists")
        except Exception as e:
            elk.log_failed_database_query(("register_player", time.time() - start) * 1000, e)
            raise e

        elk.log_database_query("register_player", (time.time() - start) * 1000)
        

    def login_player(self, name: str, password: str) -> int:
        start = time.time()

        try:
            self.cursor.execute("SELECT id FROM players WHERE name=%s AND password=%s", (name, password))
        except Exception as e:
            elk.log_failed_database_query(("login_player", time.time() - start) * 1000, e)
            raise e
        
        elk.log_database_query("login_player", (time.time() - start) * 1000)
        
        id = self.cursor.fetchone()
        if id == None:
            raise NotFoundException("Invalid username or password")
        return id[0]

    def get_id_by_name(self, name: str) -> int:
        start = time.time()

        try:
            self.cursor.execute("SELECT id FROM players WHERE name=%s", (name,))
        except Exception as e:
            elk.log_failed_database_query(("get_id_by_name", time.time() - start) * 1000, e)
            raise e
        
        elk.log_database_query("get_id_by_name", (time.time() - start) * 1000)
        
        id = self.cursor.fetchone()
        if id == None:
            raise NotFoundException("Username not found")
        return id[0]

    def get_all_players(self):
        start = time.time()

        try:
            self.cursor.execute("SELECT * FROM players")
        except Exception as e:
            elk.log_failed_database_query(("get_all_players", time.time() - start) * 1000, e)
            raise e
        
        elk.log_database_query("get_all_players", (time.time() - start) * 1000)
        
        player_tuples = self.cursor.fetchall()
        return [self.map_player_to_object(player) for player in player_tuples]
    
    def get_player_by_id(self, id: int):
        start = time.time()

        try:
            self.cursor.execute("SELECT * FROM players WHERE id=%s", (id,))
        except Exception as e:
            elk.log_failed_database_query(("get_player_by_id", time.time() - start) * 1000, e)
            raise e
        
        elk.log_database_query("get_player_by_id", (time.time() - start) * 1000)

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
        start = time.time()
        try:
            if won:
                self.cursor.execute("UPDATE players SET games_played = games_played + 1, games_won = games_won + 1 WHERE id = %s", (id,))
            else:
                self.cursor.execute("UPDATE players SET games_played = games_played + 1 WHERE id = %s", (id,))
        except Exception as e:
            elk.log_failed_database_query("update_player_game", (time.time() - start) * 1000, e)
            raise e
        elk.log_database_query("update_player_game", (time.time() - start) * 1000)

    def endOfGameSession(self, queryValues):
        self.cursor.executemany("INSERT INTO playerGameSessions VALUES (%s, %s)", queryValues)

    def rollbackEndOfGameSession(self, gameSessionUUID):
        self.cursor.execute("DELETE FROM playerGameSessions VALUES where gameSessionId = %s", (gameSessionUUID,))