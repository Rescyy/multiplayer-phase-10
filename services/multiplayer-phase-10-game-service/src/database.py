import time
import psycopg2
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
        self.dbname = "game-service-db"
        self.user = "game_db"
        self.password = "1234"
        self.host = os.getenv("GAME_DB_HOST")
        self.port = os.getenv("GAME_DB_PORT")
        self.connection = None
        retries = 2
        for i in range(retries):
            try:
                print("Trying to connect to database")
                self.connection = psycopg2.connect(dbname=self.dbname, user=self.user, password=self.password, host=self.host, port=self.port)
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
            self.create_tables()
            return True

    def create_tables(self):
        query_path = os.getenv("QUERY_PATH")

        start = time.time()
        try:
            with open(f"{query_path}/create_table_game_sessions.sql", "r") as file:
                query = file.read()
                self.cursor.execute(query)

            with open(f"{query_path}/create_table_game_logs.sql", "r") as file:
                query = file.read()
                self.cursor.execute(query)
                
            self.connection.commit()
        except Exception as e:
            elk.log_failed_database_query("create_tables_if_not_present", (time.time() - start) * 1000, e)
            raise e
        
        elk.log_database_query("create_tables", (time.time() - start) * 1000)

    def endOfGameSession(self, gameSessionValues, gameLogsValues):
        start = time.time()
        try:
            self.cursor.execute("insert into gameSessions (id, creation_time, code) values (%s, %s, %s)", gameSessionValues)
            self.cursor.executemany("insert into gameLogs (gameSessionId, log_time, playerName, playerId, type, message) values (%s, %s, %s, %s, %s, %s)", gameLogsValues)
            self.connection.commit()
        except Exception as e:
            elk.log_failed_database_query("endOfGameSession", (time.time() - start) * 1000, e)
            raise e

        elk.log_database_query("endOfGameSession", (time.time() - start) * 1000)

    def rollbackEndOfGameSession(self, gameSessionId):
        start = time.time()
        try:
            self.cursor.execute("delete from gameSessions where id = %s", (gameSessionId,))
            self.cursor.execute("delete from gameLogs where gameSessionId = %s", (gameSessionId,))
            self.connection.commit()
        except Exception as e:
            elk.log_failed_database_query("rollbackEndOfGameSession", (time.time() - start) * 1000, e)
            raise e

        elk.log_database_query("rollbackEndOfGameSession", (time.time() - start) * 1000)
    